let Converter = require('./converter');

const knx = require('knx');

class KNXInterface
{
	constructor(gatewayIP, DeviceManager)
	{
		this.DeviceManager = DeviceManager;
		this.logger = DeviceManager.logger;
		this.TypeManager = DeviceManager.TypeManager;
		this.EventManager = DeviceManager.EventManager;

		this.requests = { status : [], control : [] };
		this.dataPoints = { status : {}, control : {} };

		this.connected = false;
		this.firstConnect = true;

		this.converter = new Converter(this);

		this.connection = knx.Connection({ ipAddr : gatewayIP, ipPort : 3671, loglevel: 'info',
			handlers : {
				connected : () => this.connectionSuccess(),
				disconnected : () => {
					
					this.connected = false;

					this.DeviceManager._updateConnectionState(this.connected);

					this.logger.debug('%knx_gateway_disconnected%!');
				},
				confirmed : (data) => {
					
					var address = data.cemi.dest_addr, event = data.cemi.apdu.apci;

					if(!this.connected)
					{
						this.connected = true;

						this.DeviceManager._updateConnectionState(this.connected);

						this.logger.log('success', 'bridge', 'Bridge', '%knx_gateway_connected%!');
					}

					if(event == 'GroupValue_Read')
					{
						this._clearRequests('status', address);
					}
					else if(event == 'GroupValue_Write')
					{
						this._clearRequests('control', address);
					}
				},
				event : (evt, src, dest, value) => {
					
					if(!this.connected)
					{
						this.connected = true;

						this.DeviceManager._updateConnectionState(this.connected);

						this.logger.log('success', 'bridge', 'Bridge', '%knx_gateway_connected%!');
					}

					this.logger.debug('GET [' + dest + '] --> [' + value[0] + ']');
				},
				error : (e) => this.logger.err(e)
			}
		});
	}

	connectionSuccess()
	{
		this.connected = true;

		this.DeviceManager._updateConnectionState(this.connected);

		if(this.firstConnect)
		{
			this.firstConnect = false;
			
			var services = this.DeviceManager._getServices();

			for(const i in services)
			{
				if(services[i].statusAddress != null)
				{
					const statusAddress = Array.isArray(services[i].statusAddress) ? services[i].statusAddress : [ services[i].statusAddress ];

					for(const j in statusAddress)
					{
						if(this.dataPoints.status[statusAddress[j]] == null)
						{
							this.dataPoints.status[statusAddress[j]] = new knx.Datapoint({ ga : statusAddress[j], dpt : services[i].dataPoint }, this.connection);

							// TODO: Write Own Change Detection And Input Conversion

							this.dataPoints.status[statusAddress[j]].on('change', (oldValue, newValue) => {

								var state = this.converter.getState(services[i], newValue);

								this._clearRequests('status', statusAddress[j], state);

								this.EventManager.setOutputStream('updateState', { receiver : statusAddress[j] }, { state, value : newValue });
							});
						}

						this.EventManager.setInputStream('updateState', { source : services[i], destination : statusAddress[j] }, (response) => {

							if(this.dataPoints.status[statusAddress[j]] != null)
							{
								if((response.state = this.TypeManager.validateUpdate(services[i].id, services[i].letters, response.state)) != null && services[i].updateState != null)
								{
									this.dataPoints.status[statusAddress[j]].current_value = response.value;

									services[i].updateState(response.state);
								}
								else
								{
									this.logger.log('error', this.id, this.letters, '[' + this.name + '] %update_error%! ( ' + this.id + ' )');
								}
							}
						});
					}
				}

				if(services[i].controlAddress != null)
				{
					const controlAddress = Array.isArray(services[i].controlAddress) ? services[i].controlAddress : [ services[i].controlAddress ];

					for(const j in controlAddress)
					{
						this.dataPoints.control[controlAddress[j]] = new knx.Datapoint({ ga : controlAddress[j], dpt : services[i].dataPoint }, this.connection);
					}
				}
			}
		}

		if(!this.platform.options.disablePreload)
		{
			this.updateStates();
		}

		this.logger.log('success', 'bridge', 'Bridge', '%knx_gateway_connected%!');
	}

	readState(service)
	{
		if(this.connected && service.statusAddress != null)
		{
			const statusAddress = Array.isArray(service.statusAddress) ? service.statusAddress : [ service.statusAddress ];

			for(const i in statusAddress)
			{
				if(this.dataPoints.status[statusAddress[i]] != null)
				{
					this.dataPoints.status[statusAddress[i]].read((src, value) => {

						var state = this.converter.getState(service, value);

						this._clearRequests('status', statusAddress[i], state);
					});
				}
			}
		}
	}

	writeState(service, value)
	{
		return new Promise((resolve) => {

			if(this.connected && service.controlAddress != null)
			{
				const controlAddress = Array.isArray(service.controlAddress) ? service.controlAddress : [ service.controlAddress ];

				for(const i in controlAddress)
				{
					if(service.invertState)
					{
						if(service.dataPoint == '5.001')
						{
							value = 100 - value;
						}
						else
						{
							value = !value;
						}
					}

					if(this.dataPoints.control[controlAddress[i]] != null)
					{
						this.dataPoints.control[controlAddress[i]].write(value);
					}

					if(this.dataPoints.status[controlAddress[i]] != null)
					{
						this.dataPoints.status[controlAddress[i]].current_value = value;
					}

					this.EventManager.setOutputStream('updateState', { sender : service, receiver : controlAddress[i] }, { value });
				}
			}
			else
			{
				resolve(false);
			}
		});
	}

	updateStates()
	{
		for(const address in this.dataPoints.status)
		{
			this.dataPoints.status[address].read((src, value) => {

				this._clearRequests('status', address);

				this.EventManager.setOutputStream('updateState', { receiver : address }, { value });
			});
		}
	}

	_addRequest(type, address, callback)
	{
		if(this.connected && address != null && callback != null)
		{
			this.requests[type].push({ address, callback });

			setTimeout(() => {

				this._clearRequests(type, address);

			}, 2000);
		}
		else
		{
			callback(type == 'status' ? {} : false);
		}
	}

	_clearRequests(type, address, state)
	{
		for(var i = this.requests[type].length - 1; i >= 0; i--)
		{
			if(this.requests[type][i].address == address)
			{
				if(type == 'status')
				{
					this.requests[type][i].callback(state || {});
				}
				else
				{
					this.requests[type][i].callback(true);
				}

				this.requests[type].splice(i, 1);
			}
		}
	}
}

module.exports = class DeviceManager
{
	constructor(platform)
	{
		this.accessories = platform.accessories;
		
		this.logger = platform.logger;

		this.TypeManager = platform.TypeManager;
		this.EventManager = platform.EventManager;

		this.KNXInterface = new KNXInterface(platform.gatewayIP, this);
	}

	getState(service)
	{
		return new Promise((resolve) => {

			this.KNXInterface._addRequest('status', service.statusAddress, resolve);

			this.KNXInterface.readState(service);
		});
	}

	setState(service, value)
	{
		return new Promise((resolve) => {

			//this.KNXInterface._addRequest('control', service.controlAddress, resolve);
			
			this.KNXInterface.writeState(service, value);

			resolve(this.KNXInterface.connected);
		});
	}

	_getServices(excludeID)
	{
		var services = [];

		for(const accessory of this.accessories)
		{
			for(const i in accessory[1].service)
			{
				if(accessory[1].service[i].dataPoint != null && (excludeID == null || accessory[1].service[i].id != excludeID))
				{
					services.push(accessory[1].service[i]);
				}
			}
		}

		return services;
	}

	_updateConnectionState(online)
	{
		for(const accessory of this.accessories)
		{
			accessory[1].setConnectionState(online);
		}
	}
}