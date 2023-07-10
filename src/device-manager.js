const knx = require('knx');

const Converter = require('./converter');

class KNXInterface
{
	constructor(gatewayIP, DeviceManager)
	{
		this.connected = false;
		this.firstConnect = true;

		this.queue = { status : [], control : [] };
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

				var controlEntry = this.queue.control[0], statusEntry = this.queue.status[0];

				if(controlEntry != null)
				{
					var state = {};

					state[controlEntry.type] = controlEntry.value;

					if(this.dataPoints.control[controlEntry.type] != null && this.dataPoints.control[controlEntry.type][controlEntry.address] != null)
					{
						this.dataPoints.control[controlEntry.type][controlEntry.address].write(controlEntry.value);
					}

					if(this.dataPoints.status[controlEntry.type] != null && this.dataPoints.status[controlEntry.type][controlEntry.address] != null)
					{
						this.dataPoints.status[controlEntry.type][controlEntry.address].current_value = controlEntry.value;
					}

					this.EventManager.setOutputStream('updateState', { sender : controlEntry.service, receiver : controlEntry.address }, state);

					this.queue.control.splice(0, 1);
				}

				if(statusEntry != null)
				{
					if(this.dataPoints.status[statusEntry.type] != null && this.dataPoints.status[statusEntry.type][statusEntry.address] != null)
					{
						this.dataPoints.status[statusEntry.type][statusEntry.address].read();
					}

					this.queue.status.splice(0, 1);
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
				if(service.statusAddress != null)
				{
					service.statusAddress = this.DeviceManager.convertAddress(service.statusAddress);

					for(const type in service.statusAddress)
					{
						for(const address of service.statusAddress[type])
						{
							if(this.dataPoints.status[type] == null)
							{
								this.dataPoints.status[type] = {};
							}

							if(this.dataPoints.status[type][address] == null && service.dataPoint.status[type] != null)
							{
								this.dataPoints.status[type][address] = new knx.Datapoint({ ga : address, dpt : 'DPT' + service.dataPoint.status[type] }, this.connection);

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
									state = this.DeviceManager.Converter.getState(service, { ...state });

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
					service.controlAddress = this.DeviceManager.convertAddress(service.controlAddress);

					for(const type in service.controlAddress)
					{
						for(const address of service.controlAddress[type])
						{
							if(this.dataPoints.control[type] == null)
							{
								this.dataPoints.control[type] = {};
							}

							if(this.dataPoints.control[type][address] == null && service.dataPoint.control[type] != null)
							{
								this.dataPoints.control[type][address] = new knx.Datapoint({ ga : address, dpt : 'DPT' + service.dataPoint.control[type] }, this.connection);
							}
						}
					}
				}
			}
		}

		if(!this.DeviceManager.platform.options.disablePreload)
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
				var dataPoint = service.dataPoint.control[type];

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
					this.dataPoints.control[type][address].write(value);
				}

				if(this.dataPoints.status[type] != null && this.dataPoints.status[type][address] != null)
				{
					this.dataPoints.status[type][address].current_value = value;
				}

				this.EventManager.setOutputStream('updateState', { sender : service, receiver : address }, state);
			}
			else
			{
				this.queue.control.push({ service, type, address, value });
			}
		}
	}

	updateStates()
	{
		for(const type in this.dataPoints.status)
		{
			for(const address in this.dataPoints.status[type])
			{
				if(this.rateLimit == 0)
				{
					this.dataPoints.status[type][address].read();
				}
				else
				{
					this.queue.status.push({ type, address });
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
		this.platform = platform;

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
				var promiseArray = [];

				for(const type in service.statusAddress)
				{
					if(!service.hasState(type))
					{
						for(const address of service.statusAddress[type])
						{
							promiseArray.push(new Promise((callback) => {

								this.KNXInterface._addRequest('status', address, (value) => callback({ type, value }));

								this.KNXInterface.readState(service, type, address);
							}));
						}
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
				for(const type in state)
				{
					if(service.controlAddress[type] != null)
					{
						for(const address of service.controlAddress[type])
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

	convertAddress(addresses)
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

	convertDataPoint(defaults, datapoints)
	{
		var result = {
			status : { ...defaults },
			control : { ...defaults }
		};

		if(datapoints instanceof Object)
		{
			if(datapoints.status != null || datapoints.control != null)
			{
				if(datapoints.status != null)
				{
					for(const x in datapoints.status)
					{
						result.status[x] = datapoints.status[x];
					}
				}

				if(datapoints.control != null)
				{
					for(const x in datapoints.control)
					{
						result.control[x] = datapoints.control[x];
					}
				}
			}
			else
			{
				for(const x in datapoints)
				{
					result.status[x] = result.control[x] = datapoints[x];
				}
			}
		}
		else if(typeof datapoints == 'string')
		{
			for(const x in result.status)
			{
				result.status[x] = datapoints;
			}

			for(const x in result.control)
			{
				result.control[x] = datapoints;
			}
		}

		return result;
	}
}