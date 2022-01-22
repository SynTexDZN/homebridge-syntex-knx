let Characteristic, DeviceManager, AutomationSystem;

const { LeakService } = require('homebridge-syntex-dynamic-platform');

module.exports = class SynTexLeakService extends LeakService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		Characteristic = manager.platform.api.hap.Characteristic;
		AutomationSystem = manager.AutomationSystem;
		DeviceManager = manager.DeviceManager;
		
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager);

		this.statusAddress = serviceConfig.address.status;

		this.invertState = serviceConfig.inverted || false;

		this.dataPoint = 'DPT1.001';

		super.getState((value) => {

			this.value = value || false;

			this.service.getCharacteristic(Characteristic.LeakDetected).updateValue(this.value);
			
		}, true);

		this.changeHandler = (state) => { // TODO: Should There Be A Change Handler ? 

			if(state.value != null)
			{
				this.value = state.value;

				this.service.getCharacteristic(Characteristic.LeakDetected).updateValue(this.value);

				super.setValue('value', this.value, true);

				AutomationSystem.LogikEngine.runAutomation(this.id, this.letters, state);
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

			this.service.getCharacteristic(Characteristic.LeakDetected).updateValue(this.value);

			super.setValue('value', this.value, true);

			AutomationSystem.LogikEngine.runAutomation(this.id, this.letters, state);
		}
	}
};