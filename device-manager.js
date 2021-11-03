const knx = require('knx');

class KNXInterface
{
	constructor(gatewayIP, DeviceManager)
	{
		this.DeviceManager = DeviceManager;
		this.logger = DeviceManager.logger;

		this.connection = knx.Connection({ ipAddr : gatewayIP, ipPort : 3671, loglevel: 'debug',
			handlers: {
				connected : () => this.connectionSuccess(),
				event : (evt, src, dest, value) => this.readState(dest, value),
				error : (connstatus) => this.logger.log('error', 'bridge', 'Bridge', '**** ERROR: %j' + connstatus)
			}
		});
	}

	connectionSuccess()
	{
		this.logger.log('success', 'bridge', 'Bridge', 'KNX IP Gateway verbunden!');

		//connection.write("2/1/0", 22.5, "DPT9.001");

		this.connected = true;

		setTimeout(() => {
		
			//this.connection.Disconnect();
		
		}, 60000);
	}

	readState(statusAddress, value)
	{
		var values = [];

		for(var i = 0; i < Object.keys(value).length; i++)
		{
			values.push(value[i]);
		}

		this.logger.debug('GET [' + statusAddress + '] --> [' + values[0] + ']');

		this.DeviceManager.updateState(null, statusAddress, values[0]);
	}

	writeState(controlAddress, state)
	{
		if(this.connected)
		{
			this.connection.write(controlAddress, state.power ? 0 : 1);
			
			return true;
		}

		return false;
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

	setState(controlAddress, state)
	{
		return new Promise((resolve) => {

			this.logger.debug('SET [' + controlAddress + '] --> [' + (state.power ? 1 : 0) + ']');

			if(Array.isArray(controlAddress))
			{
				for(const i in controlAddress)
				{
					this.KNXInterface.writeState(controlAddress[i], state)
				}
			}
			else
			{
				this.KNXInterface.writeState(controlAddress, state)
			}

			resolve(this.KNXInterface.connected);
		});
	}

	updateState(id, statusAddress, value)
	{
		for(const accessory of this.accessories)
		{
			for(const i in accessory[1].service)
			{
				if((Array.isArray(statusAddress) && statusAddress.includes(accessory[1].service[i].statusAddress)) || (accessory[1].service[i].statusAddress == statusAddress) && accessory[1].id != id)
				{
					var type = this.TypeManager.letterToType(accessory[1].service[i].letters[0]), dataType = this.TypeManager.getDataType(type);

					if(dataType == 'boolean')
					{
						if(type == 'switch' || type == 'outlet' || type == 'relais' || type == 'led')
						{
							accessory[1].service[i].updateState({ power : value == 1 });
						}
						else
						{
							accessory[1].service[i].updateState({ value : value == 1 });
						}
					}
					else
					{
						accessory[1].service[i].updateState({ value : value });
					}
				}
			}
		}
	}
}