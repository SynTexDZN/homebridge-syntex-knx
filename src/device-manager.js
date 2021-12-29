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
				error : (e) => this.logger.err(e),
				disconnected : () => this.logger.debug('%knx_gateway_disconnected%!')
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
				const statusAddress = Array.isArray(services[i].statusAddress) ? services[i].statusAddress : [ services[i].statusAddress ];

				for(const j in statusAddress)
				{
					if(this.dataPoints.status[statusAddress[j]] == null)
					{
						this.dataPoints.status[statusAddress[j]] = new knx.Datapoint({ ga : statusAddress[j], dpt : services[i].dataPoint }, this.connection);

						this.dataPoints.status[statusAddress[j]].on('change', (oldValue, newValue) => {

							this._clearRequests('status', statusAddress[j]);

							this.EventManager.setOutputStream('SynTexKNX', null, statusAddress[j], newValue);
						});
					}

					this.EventManager.setInputStream('SynTexKNX', services[i], statusAddress[j], (value) => {

						if(this.dataPoints.status[statusAddress[j]] != null)
						{
							if(services[i].invertState)
							{
								value = !value;
							}

							this.dataPoints.status[statusAddress[j]].current_value = value;

							var type = this.TypeManager.letterToType(services[i].letters[0]);

							if(type == 'outlet' || type == 'relais' || type == 'switch' || type == 'led')
							{
								services[i].updateState({ power : value });
							}
							else
							{
								services[i].updateState({ value });
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

		this.updateStates();

		this.logger.log('success', 'bridge', 'Bridge', '%knx_gateway_connected%!');
	}

	readState(service)
	{
		return new Promise((resolve) => {

			if(this.connected && service.statusAddress != null)
			{
				const statusAddress = Array.isArray(service.statusAddress) ? service.statusAddress : [ service.statusAddress ];

				for(const i in statusAddress)
				{
					if(this.dataPoints.status[statusAddress[i]] != null)
					{
						this.dataPoints.status[statusAddress[i]].read((src, value) => {

							this._clearRequests('status', statusAddress[i]);

							if(service.invertState)
							{
								value = !value;
							}
		
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
				const controlAddress = Array.isArray(service.controlAddress) ? service.controlAddress : [ service.controlAddress ];

				for(const i in controlAddress)
				{
					if(this.dataPoints.control[controlAddress[i]] != null)
					{
						if(service.invertState)
						{
							this.dataPoints.control[controlAddress[i]].write(!value);
						}
						else
						{
							this.dataPoints.control[controlAddress[i]].write(value);
						}
					}

					this.EventManager.setOutputStream('SynTexKNX', null, controlAddress[i], value);
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

				this.EventManager.setOutputStream('SynTexKNX', null, address, value);
			});
		}
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
	constructor(logger, accessories, gatewayIP, TypeManager, EventManager)
	{
		this.logger = logger;
		this.accessories = accessories;

		this.TypeManager = TypeManager;
		this.EventManager = EventManager;

		this.KNXInterface = new KNXInterface(gatewayIP, this);
	}

	getState(service)
	{
		return new Promise((resolve) => {

			this.KNXInterface._addRequest('status', service.statusAddress, resolve);

			setTimeout(() => {

				this.KNXInterface._clearRequests('status', service.statusAddress);

			}, 3000);

			this.KNXInterface.readState(service);
		});
	}

	setState(service, value)
	{
		return new Promise((resolve) => {

			//this.KNXInterface._addRequest('control', service.controlAddress, resolve);
			
			this.KNXInterface.writeState(service, value);

			resolve(true);
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
}