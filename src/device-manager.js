const knx = require('knx');

const Converter = require('./converter');

class KNXInterface
{
	constructor(gatewayIP, DeviceManager)
	{
		this.connected = false;
		this.firstConnect = true;

		this.requests = { status : {}, control : {} };
		this.dataPoints = { status : {}, control : {} };

		this.DeviceManager = DeviceManager;

		this.logger = DeviceManager.logger;
		
		this.EventManager = DeviceManager.EventManager;
		this.TypeManager = DeviceManager.TypeManager;

		this.connection = knx.Connection({ ipAddr : gatewayIP, ipPort : 3671, loglevel: 'info',
			handlers : {
				connected : () => this.interfaceConnected(),
				disconnected : () => this.interfaceDisconnected(),
				confirmed : (data) => this.interfaceConfirmed(data),
				event : (event, source, destination, value) => this.interfaceEvent(destination, value),
				error : (e) => this.logger.err(e)
			}
		});
	}

	interfaceConnected()
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
				var dataPoints = this.DeviceManager.getDataPoints(service.dataPoint);

				if(service.statusAddress != null)
				{
					var statusAddress = this.DeviceManager.getAddresses(service.statusAddress);

					for(const type in statusAddress)
					{
						for(const address of statusAddress[type])
						{
							if(this.dataPoints.status[address] == null)
							{
								this.dataPoints.status[address] = new knx.Datapoint({ ga : address, dpt : 'DPT' + dataPoints[type] }, this.connection);

								// TODO: Write Own Change Detection And Input Conversion

								this.dataPoints.status[address].on('change', (oldValue, newValue) => {

									var state = {};

									state[type] = newValue;

									this._clearRequests('status', address, newValue);

									this.EventManager.setOutputStream('updateState', { receiver : address }, state);
								});
							}

							this.EventManager.setInputStream('updateState', { source : service, destination : address }, (state) => {

								if(this.dataPoints.status[address] != null)
								{
									state = this.DeviceManager.Converter.getState(service, state);

									if((state = this.TypeManager.validateUpdate(service.id, service.letters, state)) != null && service.updateState != null)
									{
										this.dataPoints.status[address].current_value = state[type];

										service.updateState(state);
									}
									else
									{
										this.logger.log('error', service.id, service.letters, '[' + this.name + '] %update_error%! ( ' + service.id + ' )');
									}
								}
							});
						}
					}
				}

				if(service.controlAddress != null)
				{
					var controlAddress = this.DeviceManager.getAddresses(service.controlAddress);

					for(const type in controlAddress)
					{
						for(const address of controlAddress[type])
						{
							this.dataPoints.control[address] = new knx.Datapoint({ ga : address, dpt : 'DPT' + dataPoints[type] }, this.connection);
						}
					}
				}
			}
		}

		if(!this.platform.options.disablePreload)
		{
			this.updateStates();
		}
	}

	interfaceDisconnected()
	{
		this.connected = false;

		this.DeviceManager._updateConnectionState(this.connected);

		this.logger.debug('%knx_gateway_disconnected%!');
	}

	interfaceConfirmed(data)
	{
		var event = data.cemi.apdu.apci/*, address = data.cemi.dest_addr*/;

		if(!this.connected)
		{
			this.connected = true;

			this.DeviceManager._updateConnectionState(this.connected);

			this.logger.log('success', 'bridge', 'Bridge', '%knx_gateway_connected%!');
		}

		if(event == 'GroupValue_Read')
		{
			//this._clearRequests('status', address);
		}
		else if(event == 'GroupValue_Write')
		{
			//this._clearRequests('control', address);
		}
	}

	interfaceEvent(destination, value)
	{
		if(!this.connected)
		{
			this.connected = true;

			this.DeviceManager._updateConnectionState(this.connected);

			this.logger.log('success', 'bridge', 'Bridge', '%knx_gateway_connected%!');
		}

		this.logger.debug('GET [' + destination + '] --> [' + value[0] + ']');
	}

	readState(service, address)
	{
		if(this.connected && service != null && address != null && this.dataPoints.status[address] != null)
		{
			this.dataPoints.status[address].read((src, value) => {

				this._clearRequests('status', address, value);
			});
		}
	}

	writeState(service, type, address, value)
	{
		return new Promise((resolve) => {

			if(this.connected && service != null && type != null && address != null && value != null)
			{
				if(service.invertState)
				{
					var dataPoint = this.DeviceManager.getDataPoints(service.dataPoint)[type];

					if(dataPoint == '5.001')
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

				this._clearRequests('status', address, value);

				this.EventManager.setOutputStream('updateState', { receiver : address }, value);
			});
		}
	}

	_addRequest(type, address, callback)
	{
		if(this.connected && address != null && callback != null)
		{
			if(this.requests[type][address] == null)
			{
				this.requests[type][address] = [];
			}

			this.requests[type][address].push(callback);

			setTimeout(() => {

				this._clearRequests(type, address);

			}, 2000);
		}
		else
		{
			callback(type == 'status' ? {} : false);
		}
	}

	_clearRequests(type, address, value)
	{
		if(this.requests[type] != null && this.requests[type][address] != null)
		{
			for(const callback of this.requests[type][address])
			{
				if(type == 'status')
				{
					callback(value);
				}
				else
				{
					callback(true);
				}
			}

			delete this.requests[type][address];
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

		this.Converter = new Converter(this);
	}

	getState(service)
	{
		return new Promise((resolve) => {

			if(service.statusAddress != null)
			{
				var statusAddress = this.getAddresses(service.statusAddress), promiseArray = [];

				for(const type in statusAddress)
				{
					for(const address of statusAddress[type])
					{
						promiseArray.push(new Promise((callback) => {

							this.KNXInterface._addRequest('status', address, (value) => callback({ type, value }));

							this.KNXInterface.readState(service, address);
						}));
					}
				}

				Promise.all(promiseArray).then((result) => {

					var state = {};

					for(const i in result)
					{
						if(result[i].type != null && result[i].value != null)
						{
							state[result[i].type] = result[i].value;
						}
					}

					state = this.Converter.getState(service, state);

					if((state = this.TypeManager.validateUpdate(service.id, service.letters, state)) == null)
					{
						this.logger.log('error', service.id, service.letters, '[' + this.name + '] %update_error%! ( ' + service.id + ' )');
					}

					resolve(state || {});
				});
			}
			else
			{
				resolve({});
			}
		});
	}

	setState(service, value)
	{
		return new Promise((resolve) => {

			if(service.controlAddress != null)
			{
				var controlAddress = this.getAddresses(service.controlAddress);

				for(const type in controlAddress)
				{
					for(const address of controlAddress[type])
					{
						//this.KNXInterface._addRequest('control', address, resolve);

						this.KNXInterface.writeState(service, type, address, value);
					}
				}
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

	getAddresses(addresses)
	{
		if(Array.isArray(addresses))
		{
			addresses = { value : addresses };
		}
		else if(typeof addresses == 'string')
		{
			addresses = { value : [ addresses ] }
		}

		for(const type in addresses)
		{
			if(!Array.isArray(addresses[type]))
			{
				addresses[type] = [ addresses[type] ];
			}
		}

		return addresses;
	}

	getDataPoints(dataPoints)
	{
		if(typeof dataPoints == 'string')
		{
			dataPoints = { value : dataPoints };
		}

		return dataPoints;
	}
}