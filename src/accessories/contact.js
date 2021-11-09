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

		this.statusAddress = serviceConfig.address.status;

		this.dataPoint = 'DPT1.001';

		super.getState((value) => {

			this.value = value || false;

			this.service.getCharacteristic(Characteristic.On).updateValue(this.value);

		}, true);

		this.changeHandler = (state) =>
		{
			if(state.value != null)
			{
				DeviceManager.setState(this.controlAddress, state).then((success) => {

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

				this.logger.log('read', this.id, this.letters, '%read_state[0]% [' + this.name + '] %read_state[1]% [' + this.value + '] ( ' + this.id + ' )');

				callback(null, this.value);
			}
			else
			{
				DeviceManager.getState(this).then((value) => {

					if(value != null && !isNaN(value))
					{
						this.value = value;

						this.logger.log('read', this.id, this.letters, '%read_state[0]% [' + this.name + '] %read_state[1]% [' + this.value + '] ( ' + this.id + ' )');
					
						super.setState(this.value, () => {});
					}

					callback(null, this.value);
				});
			}
		});
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