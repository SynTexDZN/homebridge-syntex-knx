const { LightService } = require('homebridge-syntex-dynamic-platform');

module.exports = class SynTexLightService extends LightService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager);

		this.dataPoint = serviceConfig.datapoint || '9.004';

		this.statusAddress = serviceConfig.address.status;
	}

	updateState(state)
	{
		if(state.value != null && !isNaN(state.value) && (!super.hasState('value') || this.value != state.value))
		{
			super.setState(state.value, 
				() => this.service.getCharacteristic(this.Characteristic.CurrentAmbientLightLevel).updateValue(state.value));
		}

		this.AutomationSystem.LogikEngine.runAutomation(this, state);
	}
};