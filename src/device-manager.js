let Converter = require('./converter');

const knx = require('knx');

class KNXInterface
{
	constructor(gatewayIP, DeviceManager)
	{
		this.connected = false;
		this.firstConnect = true;

		this.requests = { status : [], control : [] };
		this.dataPoints = { status : {}, control : {} };

		this.DeviceManager = DeviceManager;

		this.logger = DeviceManager.logger;
		
		this.EventManager = DeviceManager.EventManager;
		this.TypeManager = DeviceManager.TypeManager;

		this.converter = new Converter(this);

		this.connection = knx.Connection({ ipAddr : gatewayIP, ipPort : 3671, loglevel: 'info',
			handlers : {
				connected : () => this.connected(),
				disconnected : () => this.disconnected(),
				confirmed : (data) => this.confirmed(data),
				event : (event, source, destination, value) => this.event(destination, value),
				error : (e) => this.logger.err(e)
			}
		});
	}

	connected()
	{
		this.connected = true;

		this.DeviceManager._updateConnectionState(this.connected);

		this.logger.log('success', 'bridge', 'Bridge', '%knx_gateway_connected%!');

		if(this.firstConnect)
		{
			this.firstConnect = false;
			
			var services = this.DeviceManager._getServices();

			for(const service of services)
			{
				if(service.statusAddress != null)
				{
					const statusAddress = Array.isArray(service.statusAddress) ? service.statusAddress : [ service.statusAddress ];

					for(const address of statusAddress)
					{
						if(this.dataPoints.status[address] == null)
						{
							this.dataPoints.status[address] = new knx.Datapoint({ ga : address, dpt : service.dataPoint }, this.connection);

							// TODO: Write Own Change Detection And Input Conversion

							this.dataPoints.status[address].on('change', (oldValue, newValue) => {

								var state = this.converter.getState(service, newValue);

								this._clearRequests('status', address, state);

								this.EventManager.setOutputStream('updateState', { receiver : address }, newValue);
							});
						}

						this.EventManager.setInputStream('updateState', { source : service, destination : address }, (value) => {

							if(this.dataPoints.status[address] != null)
							{
								var state = this.converter.getState(service, value);

								if((state = this.TypeManager.validateUpdate(service.id, service.letters, state)) != null && service.updateState != null)
								{
									this.dataPoints.status[address].current_value = value;

									service.updateState(state);
								}
								else
								{
									this.logger.log('error', this.id, this.letters, '[' + this.name + '] %update_error%! ( ' + this.id + ' )');
								}
							}
						});
					}
				}

				if(service.controlAddress != null)
				{
					const controlAddress = Array.isArray(service.controlAddress) ? service.controlAddress : [ service.controlAddress ];

					for(const address of controlAddress)
					{
						this.dataPoints.control[address] = new knx.Datapoint({ ga : address, dpt : service.dataPoint }, this.connection);
					}
				}
			}
		}

		if(!this.platform.options.disablePreload)
		{
			this.updateStates();
		}
	}

	disconnected()
	{
		this.connected = false;

		this.DeviceManager._updateConnectionState(this.connected);

		this.logger.debug('%knx_gateway_disconnected%!');
	}

	confirmed(data)
	{
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
	}

	event(destination, value)
	{
		if(!this.connected)
		{
			this.connected = true;

			this.DeviceManager._updateConnectionState(this.connected);

			this.logger.log('success', 'bridge', 'Bridge', '%knx_gateway_connected%!');
		}

		this.logger.debug('GET [' + destination + '] --> [' + value[0] + ']');
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

	writeState(service, address, value)
	{
		return new Promise((resolve) => {

			if(this.connected)
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

				if(this.dataPoints.control[address] != null)
					{
					this.dataPoints.control[address].write(value);
					}

				if(this.dataPoints.status[address] != null)
					{
					this.dataPoints.status[address].current_value = value;
					}

				this.EventManager.setOutputStream('updateState', { sender : service, receiver : address }, value);
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

				this.EventManager.setOutputStream('updateState', { receiver : address }, value);
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

			const statusAddress = Array.isArray(service.statusAddress) ? service.statusAddress : [ service.statusAddress ];

			for(const address of statusAddress)
			{
				//this.KNXInterface._addRequest('control', address, resolve);
			
				this.KNXInterface.writeState(service, address, value);
			}

			resolve(this.KNXInterface.connected);
		});
	}

	_getServices(id)
	{
		var services = [];

		for(const accessory of this.accessories)
		{
			for(const service of accessory[1].service)
			{
				if(service.dataPoint != null && (id == null || service.id != id))
				{
					services.push(service);
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