module.exports = class DeviceManager
{
	constructor(logger, KNXInterface)
	{
		this.logger = logger;
		this.KNXInterface = KNXInterface;
	}

	getState(address)
	{
		return new Promise((resolve) => {

			if(this.KNXInterface.getConnectionStatus())
			{
				this.KNXInterface.connection.read(address, (src, responsevalue) => console.log(src, responsevalue));
			}

			console.log('GET ' + address + ' --> ' + this.KNXInterface.getConnectionStatus());

			resolve(true);
		});
	}

	setState(address, value)
	{
		return new Promise((resolve) => {

			if(this.KNXInterface.getConnectionStatus())
			{
				this.KNXInterface.connection.write(address, value.power ? 0 : 1);
			}

			console.log('SET ' + address + ' --> [' + value.power ? 1 : 0 + ']');

			resolve(true);
		});
	}
}