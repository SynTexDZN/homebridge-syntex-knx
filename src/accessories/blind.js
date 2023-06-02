const { BlindService } = require('homebridge-syntex-dynamic-platform');

module.exports = class SynTexBlindService extends BlindService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager);

		this.DeviceManager = manager.DeviceManager;

		this.dataPoint = serviceConfig.datapoint || '1.008';
		
		this.statusAddress = serviceConfig.address.status;
		this.controlAddress = serviceConfig.address.control;

		this.invertState = serviceConfig.inverted || false;

		this.timeDelayUp = serviceConfig.delay != null && serviceConfig.delay.up != null ? serviceConfig.delay.up : 11000;
		this.timeDelayDown = serviceConfig.delay != null && serviceConfig.delay.down != null ? serviceConfig.delay.down : 10000;

		this.changeHandler = (state) => {

			if(state.value != null)
			{
				this.setTargetPosition(state.value, () => {});
			}
		};
	}

	getTargetPosition(callback)
	{
		super.getTargetPosition((value) => {

			if(super.hasState('value'))
			{
				this.value = value;

				this.logger.log('read', this.id, this.letters, '%read_state[0]% [' + this.name + '] %read_state[1]% [' + this.value + '] ( ' + this.id + ' )');

				callback(null, this.value);
			}
			else
			{
				this.DeviceManager.getState(this).then((state) => {

					if(state.value != null && !isNaN(state.value))
					{
						this.value = state.value;

						super.setTargetPosition(this.value,
							() => this.logger.log('read', this.id, this.letters, '%read_state[0]% [' + this.name + '] %read_state[1]% [' + this.value + '] ( ' + this.id + ' )'));
					}

					callback(null, this.value);
				});
			}
		});
	}
	
	setTargetPosition(value, callback)
	{
		this.DeviceManager.setState(this, { value : (100 - value) }).then((success) => {

			if(success)
			{
				this.value = value;

				super.setTargetPosition(this.value,
					() => this.updateTarget(this.value), true);

				callback();
			
				this.AutomationSystem.LogikEngine.runAutomation(this, { value });
			}
			else
			{
				callback(new Error('Not Connected'));
			}
		});
	}

	getCurrentPosition(callback)
	{
		callback(null, this.value);
	}

	getPositionState(callback)
	{
		callback(null, this.state);
	}

	updateState(state)
	{
		if(state.value != null && !isNaN(state.value))
		{
			state.value = 100 - state.value;

			if(!super.hasState('value') || this.value != state.value)
			{
				this.value = state.value;

				super.setTargetPosition(this.value,
					() => this.updateTarget(this.value), true);
			}
		}

		this.AutomationSystem.LogikEngine.runAutomation(this, state);
	}

	updateTarget(value)
	{
		this.state = value > 0 ? this.Characteristic.PositionState.INCREASING : this.Characteristic.PositionState.DECREASING;

		this.service.getCharacteristic(this.Characteristic.TargetPosition).updateValue(value);
		this.service.getCharacteristic(this.Characteristic.PositionState).updateValue(this.state);

		super.setPositionState(this.state, () => setTimeout(() => {

			this.state = this.Characteristic.PositionState.STOPPED;

			this.service.getCharacteristic(this.Characteristic.CurrentPosition).updateValue(this.value);
			this.service.getCharacteristic(this.Characteristic.PositionState).updateValue(this.state);

			super.setPositionState(this.state, () => {});

		}, value > 0 ? this.timeDelayUp : this.timeDelayDown));
	}
};