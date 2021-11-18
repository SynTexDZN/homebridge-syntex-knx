let DeviceManager = require('./src/device-manager'), TypeManager = require('./src/type-manager'), AutomationSystem = require('syntex-automation'), EventManager = require('./src/event-manager');

const { DynamicPlatform, ContextManager } = require('homebridge-syntex-dynamic-platform');

const SynTexUniversalAccessory = require('./src/universal');

const pluginID = 'homebridge-syntex-knx';
const pluginName = 'SynTexKNX';
const pluginVersion = require('./package.json').version;

module.exports = (homebridge) => homebridge.registerPlatform(pluginID, pluginName, SynTexKNXPlatform, true);

class SynTexKNXPlatform extends DynamicPlatform
{
	constructor(log, config, api)
	{
		super(config, api, pluginID, pluginName, pluginVersion);

		this.devices = config['accessories'] || [];

		this.gatewayIP = config['ip'];
	
		if(this.api != null && this.logger != null && this.files != null && this.gatewayIP != null)
		{
			this.api.on('didFinishLaunching', () => {

				TypeManager = new TypeManager(this.logger);
				EventManager = new EventManager(this.logger);
				DeviceManager = new DeviceManager(this.logger, this.accessories, this.gatewayIP, TypeManager, EventManager);
				AutomationSystem = new AutomationSystem(this.logger, this.files, this, pluginName, this.api.user.storagePath());

				this.loadAccessories();
				this.initWebServer();
			});
		}
		else
		{
			throw new Error('Minimal parameters not configurated. Please check the README! https://github.com/SynTexDZN/homebridge-syntex-knx/blob/master/README.md');
		}
	}

	initWebServer()
	{
		if(this.port != null)
		{
			this.WebServer.addPage('/reload-automation', async (response) => {

				response.write(await AutomationSystem.LogikEngine.loadAutomation() ? 'Success' : 'Error');
				response.end();
			});
		}
	}

	loadAccessories()
	{
		for(const device of this.devices)
		{
			const homebridgeAccessory = this.getAccessory(device.id);

			device.manufacturer = pluginName;

			this.addAccessory(new SynTexUniversalAccessory(homebridgeAccessory, device, { platform : this, logger : this.logger, DeviceManager : DeviceManager, AutomationSystem : AutomationSystem, ContextManager : ContextManager }));
		}
	}
}