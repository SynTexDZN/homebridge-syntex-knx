const { HumidityService } = require('homebridge-syntex-dynamic-platform');

let DeviceManager;

module.exports = class SynTexHumidityService extends HumidityService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		DeviceManager = manager.DeviceManager;
		
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager);

		this.dataPoint = 'DPT9.007';

		this.statusAddress = serviceConfig.address.status;

		super.getState((value) => {

			this.value = value || 0;

			this.service.getCharacteristic(this.Characteristic.CurrentRelativeHumidity).updateValue(this.value);
			
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

			this.service.getCharacteristic(this.Characteristic.CurrentRelativeHumidity).updateValue(this.value);

			super.setValue('value', this.value, true);
		}

		this.AutomationSystem.LogikEngine.runAutomation(this.id, this.letters, state);
	}
};