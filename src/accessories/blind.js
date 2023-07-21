const { BlindService } = require('homebridge-syntex-dynamic-platform');

module.exports = class SynTexBlindService extends BlindService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager);

		this.DeviceManager = manager.DeviceManager;

		this.dataPoint = this.DeviceManager.convertDataPoint({ value : '5.001', target : '5.001', state : '1.009', stop : '1.010' }, serviceConfig.datapoint);
		
		this.statusAddress = serviceConfig.address.status;
		this.controlAddress = serviceConfig.address.control;

		if(this.dataPoint.control.target == '1.008')
		{
			if(this.controlAddress instanceof Object && this.controlAddress.stop != null)
			{
				super.updateProperties('target', { minStep : 50 });
			}
			else
			{
				super.updateProperties('target', { minStep : 100 });
			}
		}

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
		const convertTarget = (target) => {

			var state = {};

			if(this.dataPoint.control.target == '1.008')
			{
				if(target == 50)
				{
					delete state.target;

					state.stop = true;
				}
				else
				{
					state.target = target == 0;
				}
			}
			else
			{
				state.target = (100 - target);
			}

			return state;
		};

		this.DeviceManager.setState(this, convertTarget(target)).then((success) => {

			if(success)
			{
				this.updateTarget(target);

				super.setTargetPosition(target, () => callback(), true);

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

		if(state.value != null && !isNaN(state.value) && (!super.hasState('value') || this.value != state.value))
		{
			super.setState(state.value,
				() => this.service.getCharacteristic(this.Characteristic.CurrentPosition).updateValue(state.value), false);

			changed = true;
		}

		if(state.target != null && !isNaN(state.target) && (!super.hasState('target') || this.target != state.target))
		{
			super.setTargetPosition(state.target,
				() => this.service.getCharacteristic(this.Characteristic.TargetPosition).updateValue(state.target), false);

			changed = true;
		}

		if(changed)
		{
			this.updateTarget();

			this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [' + this.getStateText() + '] ( ' + this.id + ' )');
		}

		this.AutomationSystem.LogikEngine.runAutomation(this, { value : this.value, target : this.target, state : this.state });
	}

	updateTarget(target)
	{
		const hasAddress = (type) => {

			if(this.statusAddress instanceof Object && this.statusAddress[type] != null)
			{
				return true;
			}

			return false;
		};

		if(hasAddress('target') || target != null)
		{
			var currentState = this.Characteristic.PositionState.STOPPED;

			if(target == null)
			{
				target = this.target;
			}

			if(target > this.value)
			{
				currentState = this.Characteristic.PositionState.INCREASING;
			}

			if(target < this.value)
			{
				currentState = this.Characteristic.PositionState.DECREASING;
			}

			super.setPositionState(currentState,
				() => this.service.getCharacteristic(this.Characteristic.PositionState).updateValue(currentState));

			if(!hasAddress('value') && this.value != target)
			{
				var delay = (target > this.value ? this.timeDelayUp : this.timeDelayDown) * Math.abs(this.value - target) / 100;

				setTimeout(() => {

					currentState = this.Characteristic.PositionState.STOPPED;

					super.setState(target,
						() => this.service.getCharacteristic(this.Characteristic.CurrentPosition).updateValue(target), false);

					super.setPositionState(currentState,
						() => this.service.getCharacteristic(this.Characteristic.PositionState).updateValue(currentState), false);
	
					this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [' + this.getStateText() + '] ( ' + this.id + ' )');
	
					this.AutomationSystem.LogikEngine.runAutomation(this, { value : this.value, target : this.target, state : this.state });
	
				}, delay);
			}
		}
		else
		{
			super.setTargetPosition(this.value,
				() => this.service.getCharacteristic(this.Characteristic.TargetPosition).updateValue(this.value), false);
		}
	}
}