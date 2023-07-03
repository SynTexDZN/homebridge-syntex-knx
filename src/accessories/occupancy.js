const { OccupancyService } = require('homebridge-syntex-dynamic-platform');

module.exports = class SynTexOccupancyService extends OccupancyService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager);

		this.DeviceManager = manager.DeviceManager;

		this.dataPoint = this.DeviceManager.convertDataPoint({ value : '1.001' }, serviceConfig.datapoint);

		this.statusAddress = serviceConfig.address.status;

		this.invertState = serviceConfig.inverted || false;
	}

	updateState(state)
	{
		if(state.value != null && !isNaN(state.value) && (!super.hasState('value') || this.value != state.value))
		{
			super.setState(state.value, 
				() => this.service.getCharacteristic(this.Characteristic.OccupancyDetected).updateValue(state.value));
		}

		this.AutomationSystem.LogikEngine.runAutomation(this, state);
	}
}