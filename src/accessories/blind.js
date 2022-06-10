const { BlindService } = require('homebridge-syntex-dynamic-platform');

let DeviceManager;

module.exports = class SynTexBlindService extends BlindService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		DeviceManager = manager.DeviceManager;

		super(homebridgeAccessory, deviceConfig, serviceConfig, manager);

		this.dataPoint = serviceConfig.datapoint || 'DPT1.008';
		
		this.statusAddress = serviceConfig.address.status;
		this.controlAddress = serviceConfig.address.control;

		this.invertState = serviceConfig.inverted || false;

		this.timeDelayUp = serviceConfig.delay != null && serviceConfig.delay.up != null ? serviceConfig.delay.up : 11000;
		this.timeDelayDown = serviceConfig.delay != null && serviceConfig.delay.down != null ? serviceConfig.delay.down : 10000;

		super.getTargetPosition((value) => {

			this.value = value || 0;

			this.service.getCharacteristic(this.Characteristic.TargetPosition).updateValue(this.value);
			this.service.getCharacteristic(this.Characteristic.CurrentPosition).updateValue(this.value);

		}, true);

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
					
						super.setTargetPosition(this.value, () => {});
					}

					callback(null, this.value);
				});
			}
		});
	}
	
	setTargetPosition(value, callback)
	{
		DeviceManager.setState(this, (100 - value)).then((success) => {

			if(success)
			{
				this.value = value;

				super.setTargetPosition(this.value, 
					() => this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [' + this.value + '] ( ' + this.id + ' )'));
			
				this.updatePosition(this.value);

				this.AutomationSystem.LogikEngine.runAutomation(this.id, this.letters, { value });

				callback();
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
		callback(null, this.position);
	}

	updateState(state)
	{
		if(state.value != null)
		{
			state.value = 100 - state.value;

			if(this.value != state.value)
			{
				this.value = state.value;

				super.setTargetPosition(this.value,
					() => this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [' + this.value + '] ( ' + this.id + ' )'));
			
				this.updatePosition(this.value);
			}
		}

		this.AutomationSystem.LogikEngine.runAutomation(this.id, this.letters, state);
	}

	updatePosition(value)
	{
		this.position = value > 0 ? this.Characteristic.PositionState.INCREASING : this.Characteristic.PositionState.DECREASING;

		this.service.getCharacteristic(this.Characteristic.TargetPosition).updateValue(value);
		this.service.getCharacteristic(this.Characteristic.PositionState).updateValue(this.position);

		super.setPositionState(this.position, () => {});

		setTimeout(() => {

			this.position = this.Characteristic.PositionState.STOPPED;

			this.service.getCharacteristic(this.Characteristic.CurrentPosition).updateValue(this.value);
			this.service.getCharacteristic(this.Characteristic.PositionState).updateValue(this.position);

			super.setPositionState(this.position, () => {});

		}, value > 0 ? this.timeDelayUp : this.timeDelayDown);
	}
};