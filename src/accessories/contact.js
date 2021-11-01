let Characteristic, DeviceManager, AutomationSystem;

const { ContactService } = require('homebridge-syntex-dynamic-platform');

module.exports = class SynTexContactService extends ContactService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		Characteristic = manager.platform.api.hap.Characteristic;
		AutomationSystem = manager.AutomationSystem;
		DeviceManager = manager.DeviceManager;
		
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager);

		this.address = serviceConfig.address;

		super.getState((value) => {

			this.value = value || false;

		}, true);

		this.changeHandler = (state) =>
		{
			if(state.value != null)
			{
				DeviceManager.setState(this.id, this.address, state).then((success) => {

					if(success)
					{
						this.value = state.value;

						this.service.getCharacteristic(Characteristic.ContactSensorState).updateValue(this.value);
		
						super.setValue('value', this.value, true);
					
						AutomationSystem.LogikEngine.runAutomation(this.id, this.letters, state);
		
						callback();	
					}
					else
					{
						callback(new Error('Not Connected'));
					}
				});
			}
		};
	}

	getState(callback)
	{
		super.getState((value) => {

			if(value != null)
			{
				this.value = value;
			}
				
			callback(null, this.value);

		}, true);
	}

	updateState(state)
	{
		if(state.value != null && !isNaN(state.value) && this.value != state.value)
		{
			this.value = state.value;

			this.service.getCharacteristic(Characteristic.ContactSensorState).updateValue(this.value);

			super.setValue('value', this.value, true);

			AutomationSystem.LogikEngine.runAutomation(this.id, this.letters, state);
		}
	}
};