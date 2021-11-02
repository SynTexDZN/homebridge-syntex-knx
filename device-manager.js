const knx = require('knx');

class KNXInterface
{
	constructor(gatewayIP, DeviceManager)
	{
		this.DeviceManager = DeviceManager;
		this.logger = DeviceManager.logger;

		this.connection = knx.Connection({ ipAddr : gatewayIP, ipPort : 3671, loglevel: 'info',
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

	readState(address, value)
	{
		var values = [];

		for(var i = 0; i < Object.keys(value).length; i++)
		{
			values.push(value[i]);
		}

		this.logger.debug('GET [' + address + '] --> [' + values[0] + ']');

		this.DeviceManager.updateState(null, address, values[0]);
	}

	writeState(address, state)
	{
		if(this.connected)
		{
			this.connection.write(address, state.power ? 0 : 1);
			
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

	setState(address, state)
	{
		return new Promise((resolve) => {

			this.logger.debug('SET [' + address + '] --> [' + (state.power ? 1 : 0) + ']');

			if(Array.isArray(address))
			{
				for(const i in address)
				{
					this.KNXInterface.writeState(address[i], state)
				}
			}
			else
			{
				this.KNXInterface.writeState(address, state)
			}

			resolve(this.KNXInterface.connected);
		});
	}

	updateState(id, address, value)
	{
		for(const accessory of this.accessories)
		{
			for(const i in accessory[1].service)
			{
				if(accessory[1].service[i].address == address && accessory[1].id != id)
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