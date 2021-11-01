let KNXInterface = require('./knx'), DeviceManager = require('./device-manager'), TypeManager = require('./type-manager'), AutomationSystem = require('syntex-automation');

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
	
		if(this.api && this.logger)
		{
			this.api.on('didFinishLaunching', () => {

				TypeManager = new TypeManager(this.logger);
				KNXInterface = new KNXInterface(this.logger, this.accessories, TypeManager);
				DeviceManager = new DeviceManager(this.logger, KNXInterface);
				AutomationSystem = new AutomationSystem(this.logger, this.files, this, pluginName, this.api.user.storagePath());

				this.loadAccessories();
				this.initWebServer();
			});
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