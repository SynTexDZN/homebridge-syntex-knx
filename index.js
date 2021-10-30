let AutomationSystem = require('syntex-automation');

const { DynamicPlatform, ContextManager } = require('homebridge-syntex-dynamic-platform');

const SynTexUniversalAccessory = require('./src/universal');

const pluginID = 'homebridge-syntex-knx';
const pluginName = 'SynTexKNX';
const pluginVersion = require('./package.json').version;

module.exports = (homebridge) => homebridge.registerPlatform(pluginID, pluginName, SynTexWebHookPlatform, true);

class SynTexWebHookPlatform extends DynamicPlatform
{
	constructor(log, config, api)
	{
		super(config, api, pluginID, pluginName, pluginVersion);

		this.devices = config['accessories'] || [];
	
		this.loadAccessories();
		this.initWebServer();
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

			this.addAccessory(new SynTexUniversalAccessory(homebridgeAccessory, device, { platform : this, logger : this.logger, AutomationSystem : AutomationSystem, ContextManager : ContextManager }));
		}
	}
}