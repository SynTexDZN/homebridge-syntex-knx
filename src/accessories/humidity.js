const { HumidityService } = require('homebridge-syntex-dynamic-platform');

module.exports = class SynTexHumidityService extends HumidityService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager);

		this.dataPoint = serviceConfig.datapoint || '9.007';

		this.statusAddress = serviceConfig.address.status;
	}

	updateState(state)
	{
		if(state.value != null && !isNaN(state.value) && (!super.hasState('value') || this.value != state.value))
		{
			super.setState(state.value, 
				() => this.service.getCharacteristic(this.Characteristic.CurrentRelativeHumidity).updateValue(state.value));
		}

		this.AutomationSystem.LogikEngine.runAutomation(this, state);
	}
};