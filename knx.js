const knx = require('knx');

module.exports = class KNXInterface
{
	constructor(logger, accessories, gatewayIP, TypeManager)
	{
		this.logger = logger;
		this.accessories = accessories;
		this.TypeManager = TypeManager;

		this.connection = knx.Connection({
			ipAddr : gatewayIP, ipPort : 3671,
			loglevel: 'info',
			handlers: {
				connected : () => this.connectionSuccess(),
				event : (evt, src, dest, value) => this.handleEvent(evt, src, dest, value),
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

	handleEvent(evt, src, dest, value)
	{
		var values = [];

		for(var i = 0; i < Object.keys(value).length; i++)
		{
			values.push(value[i]);
		}

		this.logger.debug('GET [' + dest + '] --> [' + values[0] + ']');

		for(const accessory of this.accessories)
		{
			for(const i in accessory[1].service)
			{
				if(accessory[1].service[i].address == dest)
				{
					if(this.TypeManager.letterToType(accessory[1].service[i].letters[0]) == 'switch')
					{
						accessory[1].service[i].updateState({ power : values[0] == 1 });
					}
					else
					{
						accessory[1].service[i].updateState({ value : values[0] });
					}
				}
			}
		}
	}

	readState(address)
	{
		if(this.connected)
		{
			this.connection.read(address, (src, responsevalue) => this.logger.debug(src + ' -----> ' + responsevalue));

			return true;
		}

		return false;
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