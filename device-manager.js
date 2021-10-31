module.exports = class DeviceManager
{
	constructor(logger, KNXInterface)
	{
        this.logger = logger;
        this.KNXInterface = KNXInterface;
    }

    updateDevice(address, value)
    {
        console.log("SET %j --> [%j]", address, value ? 1 : 0);

        this.KNXInterface.connection.write(address, value ? 0 : 1);
    }
}