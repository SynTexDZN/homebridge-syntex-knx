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
				this.setTargetPosition(state.value,
					() => this.service.getCharacteristic(this.Characteristic.TargetPosition).updateValue(state.value));
			}
		};
	}

	setTargetPosition(target, callback)
	{
		this.DeviceManager.setState(this, { value : (100 - target) }).then((success) => {

			if(success)
			{
				super.setTargetPosition(target, () => callback());

				this.updateTarget();

				this.AutomationSystem.LogikEngine.runAutomation(this, { value : this.value, target : this.target, state : this.state });
			}
			else
			{
				callback(new Error('Not Connected'));
			}
		});
	}

	updateState(state)
	{
		var changed = false;

		if(state.value != null && !isNaN(state.value))
		{
			state.value = 100 - state.value;

			if(!super.hasState('value') || this.value != state.value)
			{
				super.setTargetPosition(state.value,
					() => this.service.getCharacteristic(this.Characteristic.TargetPosition).updateValue(state.value));

				changed = true;
			}
		}

		if(changed)
		{
			this.updateTarget();
		}

		this.AutomationSystem.LogikEngine.runAutomation(this, { value : this.value, target : this.target, state : this.state });
	}

	updateTarget()
	{
		var currentState = this.target > 0 ? this.Characteristic.PositionState.INCREASING : this.Characteristic.PositionState.DECREASING;

		super.setPositionState(currentState,
			() => this.service.getCharacteristic(this.Characteristic.PositionState).updateValue(currentState), true);

		this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [' + this.getStateText() + '] ( ' + this.id + ' )');

		super.setPositionState(this.state, () => setTimeout(() => {

			currentState = this.Characteristic.PositionState.STOPPED;

			super.setState(this.target,
				() => this.service.getCharacteristic(this.Characteristic.CurrentPosition).updateValue(this.target), false);

			super.setPositionState(currentState,
				() => this.service.getCharacteristic(this.Characteristic.PositionState).updateValue(currentState), false);

			this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [' + this.getStateText() + '] ( ' + this.id + ' )');

			this.AutomationSystem.LogikEngine.runAutomation(this, { value : this.value, target : this.target, state : this.state });

		}, this.target > 0 ? this.timeDelayUp : this.timeDelayDown), true);
	}
};