const knx = require('knx');

const Converter = require('./converter');

class KNXInterface
{
	constructor(gatewayIP, DeviceManager)
	{
		this.connected = false;
		this.firstConnect = true;

		this.queue = [];

		this.requests = { status : {}, control : {} };
		this.dataPoints = { status : {}, control : {} };

		this.DeviceManager = DeviceManager;

		this.logger = DeviceManager.logger;
		
		this.EventManager = DeviceManager.EventManager;
		this.TypeManager = DeviceManager.TypeManager;
		
		this.rateLimit = DeviceManager.rateLimit;

		this.connection = knx.Connection({ ipAddr : gatewayIP, ipPort : 3671, loglevel: 'info',
			handlers : {
				connected : () => this.interfaceConnected(),
				disconnected : () => this.interfaceDisconnected(),
				confirmed : (data) => this.interfaceConfirmed(data),
				event : (event, source, destination, value) => this.interfaceEvent(destination, value),
				error : (e) => this.logger.err(e)
			}
		});

		if(this.rateLimit > 0)
		{
			setInterval(() => {

				var entry = this.queue[0];

				if(entry != null)
				{
					var state = {};

					state[entry.type] = entry.value;

					if(this.dataPoints.control[entry.address] != null)
					{
						this.dataPoints.control[entry.address].write(entry.value);
					}

					if(this.dataPoints.status[entry.address] != null)
					{
						this.dataPoints.status[entry.address].current_value = entry.value;
					}

					this.EventManager.setOutputStream('updateState', { sender : entry.service, receiver : entry.address }, state);

					this.queue.splice(0, 1);
				}

			}, this.rateLimit);
		}
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
							if(this.dataPoints.status[type] == null)
							{
								this.dataPoints.status[type] = {};
							}

							if(this.dataPoints.status[type][address] == null)
							{
								this.dataPoints.status[type][address] = new knx.Datapoint({ ga : address, dpt : 'DPT' + dataPoints[type] }, this.connection);

								// TODO: Write Own Change Detection And Input Conversion

								this.dataPoints.status[type][address].on('change', (oldValue, newValue) => {

									var state = {};

									state[type] = newValue;

									this._clearRequests('status', address, newValue);

									this.EventManager.setOutputStream('updateState', { receiver : address }, state);
								});
							}

							this.EventManager.setInputStream('updateState', { source : service, destination : address }, (state) => {

								if(this.dataPoints.status[type][address] != null)
								{
									state = this.DeviceManager.Converter.getState(service, state);

									if((state = this.TypeManager.validateUpdate(service.id, service.letters, state)) != null && service.updateState != null)
									{
										this.dataPoints.status[type][address].current_value = state[type];

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
							if(this.dataPoints.control[type] == null)
							{
								this.dataPoints.control[type] = {};
							}

							this.dataPoints.control[type][address] = new knx.Datapoint({ ga : address, dpt : 'DPT' + dataPoints[type] }, this.connection);
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

	readState(service, type, address)
	{
		if(this.connected && service != null && address != null && this.dataPoints.status[type] != null && this.dataPoints.status[type][address] != null)
		{
			this.dataPoints.status[type][address].read((src, value) => {

				this._clearRequests('status', address, value);
			});
		}
	}

	writeState(service, type, address, value)
	{
		if(this.connected && service != null && type != null && address != null && value != null)
		{
			if(service.invertState)
			{
				var dataPoint = this.DeviceManager.getDataPoints(service.dataPoint)[type];

				if(dataPoint.startsWith('1.')
				|| dataPoint.startsWith('2.'))
				{
					value = !value;
				}

				if(dataPoint == '5.001')
				{
					value = 100 - value;
				}
				
				if(dataPoint == '5.003')
				{
					value = 360 - value;
				}
				
				if(dataPoint == '5.004'
				|| dataPoint == '5.005'
				|| dataPoint == '5.006'
				|| dataPoint == '5.010'
				|| dataPoint == '5.100')
				{
					value = 255 - value;
				}
			}

			if(this.rateLimit == 0)
			{
				var state = {};

				state[type] = value;

				if(this.dataPoints.control[type] != null && this.dataPoints.control[type][address] != null)
				{
					this.dataPoints.control[address].write(value);
				}

				if(this.dataPoints.status[type] != null && this.dataPoints.status[type][address] != null)
				{
					this.dataPoints.status[type][address].current_value = value;
				}

				this.EventManager.setOutputStream('updateState', { sender : service, receiver : address }, state);
			}
			else
			{
				this.queue.push({ service, type, address, value });
			}
		}
	}

	updateStates()
	{
		var services = this.DeviceManager._getServices(), addresses = {};

		for(const service of services)
		{
			if(service.statusAddress != null)
			{
				var statusAddress = this.DeviceManager.getAddresses(service.statusAddress);

				for(const type in statusAddress)
				{
					if(addresses[type] == null)
					{
						addresses[type] = [];
					}

					for(const address of statusAddress[type])
					{
						if(!addresses[type].includes(address))
						{
							addresses[type].push(address);
						}
					}
				}
			}
		}

		for(const type in addresses)
		{
			for(const address of addresses[type])
			{
				if(this.dataPoints.status[type] != null && this.dataPoints.status[type][address] != null)
				{
					this.dataPoints.status[type][address].read((src, value) => {

						var state = {};

						state[type] = value;

						this._clearRequests('status', address, value);
		
						this.EventManager.setOutputStream('updateState', { receiver : address }, state);
					});
				}
			}
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

		this.rateLimit = platform.rateLimit;

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

							this.KNXInterface.readState(service, type, address);
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

	setState(service, state)
	{
		return new Promise((resolve) => {

			if(typeof state == 'string')
			{
				state = { value : state };
			}

			if(service.controlAddress != null)
			{
				var controlAddress = this.getAddresses(service.controlAddress);

				for(const type in state)
				{
					if(controlAddress[type] != null)
					{
						for(const address of controlAddress[type])
						{
							//this.KNXInterface._addRequest('control', address, resolve);

							this.KNXInterface.writeState(service, type, address, state[type]);
						}
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