const { HumidityService } = require('homebridge-syntex-dynamic-platform');

module.exports = class SynTexHumidityService extends HumidityService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager);

		this.DeviceManager = manager.DeviceManager;

		this.dataPoint = serviceConfig.datapoint || '9.007';

		this.statusAddress = serviceConfig.address.status;
	}

	getState(callback)
	{
		super.getState((value) => {

			if(super.hasState('value'))
			{
				this.value = value;

				this.logger.log('read', this.id, this.letters, '%read_state[0]% [' + this.name + '] %read_state[1]% [' + value + '] ( ' + this.id + ' )');

				callback(null, value);
			}
			else
			{
				this.DeviceManager.getState(this).then((state) => {

					if(state.value != null && !isNaN(state.value))
					{
						this.value = state.value;

						super.setState(state.value,
							() => this.logger.log('read', this.id, this.letters, '%read_state[0]% [' + this.name + '] %read_state[1]% [' + state.value + '] ( ' + this.id + ' )'));
					}

					callback(null, this.value);
				});
			}
		});
	}

	updateState(state)
	{
		if(state.value != null && !isNaN(state.value) && (!super.hasState('value') || this.value != state.value))
		{
			this.value = state.value;

			super.setState(state.value,
				() => this.service.getCharacteristic(this.Characteristic.CurrentRelativeHumidity).updateValue(state.value), true);
		}

		this.AutomationSystem.LogikEngine.runAutomation(this, state);
	}
};