const { CoverService } = require('homebridge-syntex-dynamic-platform');

let DeviceManager;

module.exports = class SynTexCoverService extends CoverService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		DeviceManager = manager.DeviceManager;

		super(homebridgeAccessory, deviceConfig, serviceConfig, manager);

		this.dataPoint = serviceConfig.datapoint || 'DPT1.008';
		
		this.statusAddress = serviceConfig.address.status;
		this.controlAddress = serviceConfig.address.control;

		this.invertState = serviceConfig.inverted || false;

		this.timeDelayUp = serviceConfig.delay.up || 6000;
		this.timeDelayDown = serviceConfig.delay.down || 5000;

		super.getTargetPosition((value) => {

			this.value = value || 0;

			this.service.getCharacteristic(this.Characteristic.TargetPosition).updateValue(this.value);
			this.service.getCharacteristic(this.Characteristic.CurrentPosition).updateValue(this.value);

		}, true);

		this.changeHandler = (state) => {

			this.convertCurrentPosition(state, (position) => {

				if(position != null)
				{
					this.updatePosition(position);

					super.setTargetPosition(position, () => {});
				}
			});
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
						this.value = value ? 0 : 100;

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
			
				this.AutomationSystem.LogikEngine.runAutomation(this.id, this.letters, { value });

				this.updatePosition(this.value);

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
		callback(null, this.positionState);
	}

	updateState(state)
	{
		var position = this.convertCurrentPosition(state);

		if(position != null && this.value != position)
		{
			this.value = position;

			super.setTargetPosition(this.value,
				() => this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [' + this.value + '] ( ' + this.id + ' )'));
		
			this.updatePosition(this.value);
		}

		this.AutomationSystem.LogikEngine.runAutomation(this.id, this.letters, state);
	}

	convertCurrentPosition(state)
	{
		var position = null;

		if(state.value != null)
		{
			position = state.value ? 0 : 100;
		}

		if(state.position != null)
		{
			position = state.position;
		}

		return position;
	}

	updatePosition(value)
	{
		this.positionState = value > 0 ? 1 : 0;

		this.service.getCharacteristic(this.Characteristic.TargetPosition).updateValue(value);
		this.service.getCharacteristic(this.Characteristic.PositionState).updateValue(this.positionState);

		setTimeout(() => {

			this.value = value;
			this.positionState = 2;

			this.service.getCharacteristic(this.Characteristic.CurrentPosition).updateValue(this.value);
			this.service.getCharacteristic(this.Characteristic.PositionState).updateValue(this.positionState);

		}, value > 0 ? this.timeDelayUp : this.timeDelayDown);
	}
};