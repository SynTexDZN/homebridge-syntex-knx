const knx = require('knx');

module.exports = class KNXInterface
{
	constructor(accessories)
	{
		this.accessories = accessories;

		this.connection = knx.Connection({
			ipAddr : '192.168.188.88', ipPort : 3671,
			loglevel: 'debug',
			handlers: {
				connected : () => this.connectionSuccess(),
				event : (evt, src, dest, value) => this.handleEvent(evt, src, dest, value),
				error : (connstatus) => console.log("**** ERROR: %j", connstatus)
			}
		});
	}

	connectionSuccess()
	{
		console.log('Connected!');

		//connection.write("2/1/0", 22.5, "DPT9.001");

		this.connected = true;

		setTimeout(() => {
		
			//this.connection.Disconnect();

			//console.log('Disconnected!');
		
		}, 60000);
	}

	handleEvent(evt, src, dest, value)
	{
		var values = [];

		for(var i = 0; i < Object.keys(value).length; i++)
		{
			values.push(value[i]);
		}

		for(const accessory of this.accessories)
		{
			for(const i in accessory[1].service)
			{
				if(accessory[1].service[i].address == dest)
				{
					accessory[1].service[i].updateState({ power : values[0] == 1 });
				}
			}
		}
	}

	getConnectionStatus()
	{
		return this.connected;
	}
}