const { MotionService } = require('homebridge-syntex-dynamic-platform');

let Characteristic, DeviceManager, AutomationSystem;

module.exports = class SynTexMotionService extends MotionService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		Characteristic = manager.platform.api.hap.Characteristic;
		AutomationSystem = manager.platform.AutomationSystem;
		DeviceManager = manager.DeviceManager;
		
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager);

		this.dataPoint = 'DPT1.001';

		this.statusAddress = serviceConfig.address.status;

		this.invertState = serviceConfig.inverted || false;

		super.getState((value) => {

			this.value = value || false;

			this.service.getCharacteristic(Characteristic.MotionDetected).updateValue(this.value);
			
		}, true);
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

			this.service.getCharacteristic(Characteristic.MotionDetected).updateValue(this.value);

			super.setValue('value', this.value, true);

			AutomationSystem.LogikEngine.runAutomation(this.id, this.letters, state);
		}
	}
};