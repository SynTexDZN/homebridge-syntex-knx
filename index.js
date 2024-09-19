const { DynamicPlatform } = require('homebridge-syntex-dynamic-platform');

const SynTexUniversalAccessory = require('./src/universal');

const DeviceManager = require('./src/device-manager');

const pluginID = 'homebridge-syntex-knx';
const pluginName = 'SynTexKNX';
const pluginVersion = require('./package.json').version;

module.exports = (homebridge) => homebridge.registerPlatform(pluginID, pluginName, SynTexKNXPlatform, true);

class SynTexKNXPlatform extends DynamicPlatform
{
	constructor(log, config, api)
	{
		super(config, api, pluginID, pluginName, pluginVersion);

		this.gatewayIP = config['ip'];

		this.rateLimit = this.options['rateLimit'] || 0;

		if(this.api != null && this.logger != null && this.files != null && this.gatewayIP != null)
		{
			this.api.on('didFinishLaunching', () => {

				this.DeviceManager = new DeviceManager(this);

				this.loadAccessories();
			});
		}
		else
		{
			throw new Error('Minimal parameters not configurated. Please check the README! https://github.com/SynTexDZN/homebridge-syntex-knx/blob/master/README.md');
		}
	}

	loadAccessories()
	{
		for(const device of this.devices)
		{
			const homebridgeAccessory = this.getAccessory(device.id);

			device.manufacturer = this.pluginName;

			this.addAccessory(new SynTexUniversalAccessory(homebridgeAccessory, device, { platform : this, DeviceManager : this.DeviceManager }));
		}
	}
}