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

			this.logger.debug('GET [' + address + '] --> [?]');

			resolve(this.KNXInterface.readState(address));
		});
	}

	setState(address, state)
	{
		return new Promise((resolve) => {

			this.logger.debug('SET [' + address + '] --> [' + (state.power ? 1 : 0) + ']');

			resolve(this.KNXInterface.writeState(address, state));
		});
	}
}