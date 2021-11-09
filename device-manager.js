const knx = require('knx');

class KNXInterface
{
	constructor(gatewayIP, DeviceManager)
	{
		this.DeviceManager = DeviceManager;
		this.logger = DeviceManager.logger;

		this.requests = { status : [], control : [] };

		this.connection = knx.Connection({ ipAddr : gatewayIP, ipPort : 3671, loglevel: 'info',
			handlers: {
				connected : () => this.connectionSuccess(),
				confirmed : (data) => {
					
					var address = data.cemi.dest_addr, event = data.cemi.apdu.apci;

					if(event == 'GroupValue_Read')
					{
						this._clearRequests('status', address);
					}
					else if(event == 'GroupValue_Write')
					{
						this._clearRequests('control', address);
					}
				},
				event : (evt, src, dest, value) => this.logger.debug('GET [' + dest + '] --> [' + value[0] + ']'),
				error : (e) => this.logger.log('error', 'bridge', 'Bridge', '**** ERROR: ' + e),
				disconnected : () => this.logger.debug('KNX IP Gateway getrennt!')
			}
		});
	}

	connectionSuccess()
	{
		this.connected = true;

		var services = this.DeviceManager._getServices();

		for(const i in services)
		{
			if(services[i].statusAddress != null)
			{
				if(services[i].statusDataPoints == null)
				{
					services[i].statusDataPoints = {};
				}

				if(Array.isArray(services[i].statusAddress))
				{
					for(const j in services[i].statusAddress)
					{
						services[i].statusDataPoints[services[i].statusAddress[j]] = new knx.Datapoint({ ga : services[i].statusAddress[j], dpt : services[i].dataPoint }, this.connection);
					
						services[i].statusDataPoints[services[i].statusAddress[j]].on('change', (oldValue, newValue) => this.DeviceManager.updateState(services[i], newValue, true));

						services[i].statusDataPoints[services[i].statusAddress[j]].read((src, value) => {

							this._clearRequests('status', services[i].statusAddress[j]);
			
							this.DeviceManager.updateState(services[i], value, true);
						});
					}
				}
				else
				{
					services[i].statusDataPoints[services[i].statusAddress] = new knx.Datapoint({ ga : services[i].statusAddress, dpt : services[i].dataPoint }, this.connection);

					services[i].statusDataPoints[services[i].statusAddress].on('change', (oldValue, newValue) => this.DeviceManager.updateState(services[i], newValue, true));

					services[i].statusDataPoints[services[i].statusAddress].read((src, value) => {

						this._clearRequests('status', services[i].statusAddress);
		
						this.DeviceManager.updateState(services[i], value, true);
					});
				}
			}

			if(services[i].controlAddress != null)
			{
				if(services[i].controlDataPoints == null)
				{
					services[i].controlDataPoints = {};
				}

				if(Array.isArray(services[i].controlAddress))
				{
					for(const j in services[i].controlAddress)
					{
						services[i].controlDataPoints[services[i].controlAddress[j]] = new knx.Datapoint({ ga : services[i].constolAddress[j], dpt : services[i].dataPoint }, this.connection);
					}
				}
				else
				{
					services[i].controlDataPoints[services[i].controlAddress] = new knx.Datapoint({ ga : services[i].controlAddress, dpt : services[i].dataPoint }, this.connection);
				}
			}
		}

		this.logger.log('success', 'bridge', 'Bridge', 'KNX IP Gateway verbunden!');
	}

	readState(service)
	{
		return new Promise((resolve) => {

			if(this.connected && service.statusAddress != null)
			{
				if(Array.isArray(service.statusAddress))
				{
					for(const i in service.statusAddress)
					{
						if(service.statusDataPoints[service.statusAddress[i]] != null)
						{
							service.statusDataPoints[service.statusAddress[i]].read((src, value) => {

								this._clearRequests('status', service.statusAddress[i]);
			
								resolve(value);
							});
						}
					}
				}
				else
				{
					if(service.statusDataPoints[service.statusAddress] != null)
					{
						service.statusDataPoints[service.statusAddress].read((src, value) => {

							this._clearRequests('status', service.statusAddress);
		
							resolve(value);
						});
					}
				}
			}
			else
			{
				resolve(null);
			}
		});
	}

	writeState(service, value)
	{
		return new Promise((resolve) => {

			if(this.connected && service.controlAddress != null)
			{
				if(Array.isArray(service.controlAddress))
				{
					for(const i in service.controlAddress)
					{
						if(service.controlDataPoints[service.controlAddress[i]] != null)
						{
							service.controlDataPoints[service.controlAddress[i]].write(value);
						}

						if(service.statusDataPoints[service.controlAddress[i]] != null)
						{
							service.statusDataPoints[service.controlAddress[i]].current_value = value; // TODO: Update State
						}
					}
				}
				else
				{
					if(service.controlDataPoints[service.controlAddress] != null)
					{
						service.controlDataPoints[service.controlAddress].write(value);
					}

					if(service.statusDataPoints[service.controlAddress] != null)
					{
						service.statusDataPoints[service.controlAddress].current_value = value; // TODO: Update State
					}
				}
			}
			else
			{
				resolve(false);
			}
		});
	}

	_addRequest(type, address, callback)
	{
		if(this.connected)
		{
			this.requests[type].push({ address, callback });
		}
		else
		{
			callback(type == 'status' ? null : false);
		}
	}

	_clearRequests(type, address)
	{
		for(var i = this.requests[type].length - 1; i >= 0; i--)
		{
			if(this.requests[type][i].address == address)
			{
				this.requests[type][i].callback(type == 'status' ? null : true);

				this.requests[type].splice(i, 1);
			}
		}
	}
}

module.exports = class DeviceManager
{
	constructor(logger, accessories, gatewayIP, TypeManager)
	{
		this.logger = logger;
		this.accessories = accessories;

		this.TypeManager = TypeManager;

		this.KNXInterface = new KNXInterface(gatewayIP, this);
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

			this.KNXInterface._addRequest('control', service.controlAddress, resolve);

			this.KNXInterface.writeState(service, value);
		});
	}

	updateState(service, value, selectAll)
	{
		var services = this._getServices(selectAll ? null : service.id);

		for(const i in services)
		{
			if((Array.isArray(service.statusAddress) && service.statusAddress.includes(services[i].statusAddress)) || services[i].statusAddress == service.statusAddress)
			{
				var type = this.TypeManager.letterToType(services[i].letters[0]);

				if(type == 'switch' || type == 'outlet' || type == 'relais' || type == 'led')
				{
					services[i].updateState({ power : value });
				}
				else
				{
					services[i].updateState({ value });
				}
			}
		}
	}

	_getServices(excludeID)
	{
		var services = [];

		for(const accessory of this.accessories)
		{
			for(const i in accessory[1].service)
			{
				if(accessory[1].service[i].statusAddress != null && accessory[1].service[i].dataPoint != null && (excludeID == null || accessory[1].service[i].id != excludeID))
				{
					services.push(accessory[1].service[i]);
				}
			}
		}

		return services;
	}
}