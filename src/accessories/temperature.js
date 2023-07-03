const { TemperatureService } = require('homebridge-syntex-dynamic-platform');

module.exports = class SynTexTemperatureService extends TemperatureService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager);

		this.DeviceManager = manager.DeviceManager;

		this.dataPoint = this.DeviceManager.convertDataPoint({ value : '9.001' }, serviceConfig.datapoint);

		this.statusAddress = serviceConfig.address.status;
	}

	updateState(state)
	{
		if(state.value != null && !isNaN(state.value) && (!super.hasState('value') || this.value != state.value))
		{
			super.setState(state.value, 
				() => this.service.getCharacteristic(this.Characteristic.CurrentTemperature).updateValue(state.value));
		}

		this.AutomationSystem.LogikEngine.runAutomation(this, state);
	}
}