const { MotionService } = require('homebridge-syntex-dynamic-platform');

module.exports = class SynTexMotionService extends MotionService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager);

		this.DeviceManager = manager.DeviceManager;

		this.dataPoint = serviceConfig.datapoint || 'DPT1.001';

		this.statusAddress = serviceConfig.address.status;

		this.invertState = serviceConfig.inverted || false;
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
				this.DeviceManager.getState(this).then((value) => {

					if(value != null && !isNaN(value))
					{
						this.value = value;

						super.setState(value,
							() => this.logger.log('read', this.id, this.letters, '%read_state[0]% [' + this.name + '] %read_state[1]% [' + value + '] ( ' + this.id + ' )'));
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
				() => this.service.getCharacteristic(this.Characteristic.MotionDetected).updateValue(state.value), true);
		}

		this.AutomationSystem.LogikEngine.runAutomation(this.id, this.letters, state);
	}
};