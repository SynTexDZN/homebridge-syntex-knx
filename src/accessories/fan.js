const { FanService } = require('homebridge-syntex-dynamic-platform');

module.exports = class SynTexFanService extends FanService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager);

		this.DeviceManager = manager.DeviceManager;

		this.dataPoint = this.DeviceManager.convertDataPoint({ value : '1.001', speed : '5.001', direction : '1.001' }, serviceConfig.datapoint);

		this.statusAddress = serviceConfig.address.status;
		this.controlAddress = serviceConfig.address.control;

		this.invertState = serviceConfig.inverted || false;

		this.changeHandler = (state) => {

			this.setToCurrentState(state, (failed) => {

				if(!failed)
				{
					this.service.getCharacteristic(this.Characteristic.On).updateValue(this.value);
					this.service.getCharacteristic(this.Characteristic.RotationSpeed).updateValue(this.speed);
					this.service.getCharacteristic(this.Characteristic.RotationDirection).updateValue(this.direction);
				}
			});
		};
	}

	setState(value, callback)
	{
		this.setToCurrentState({ value }, (failed) => {

			if(!failed)
			{
				callback();
			}
			else
			{
				callback(new Error('Not Connected'));
			}
		});
	}

	setRotationSpeed(speed, callback)
	{
		this.setToCurrentState({ speed }, (failed) => {

			if(!failed)
			{
				callback();
			}
			else
			{
				callback(new Error('Not Connected'));
			}
		});
	}

	setRotationDirection(direction, callback)
	{
		this.setToCurrentState({ direction }, (failed) => {

			if(!failed)
			{
				callback();
			}
			else
			{
				callback(new Error('Not Connected'));
			}
		});
	}

	updateState(state)
	{
		if(!this.running)
		{
			var changed = false;

			if(state.value != null && !isNaN(state.value) && (!super.hasState('value') || this.value != state.value))
			{
				super.setState(state.value, 
					() => this.service.getCharacteristic(this.Characteristic.On).updateValue(state.value), false);

				changed = true;
			}

			if(state.speed != null && !isNaN(state.speed) && (!super.hasState('speed') || this.speed != state.speed))
			{
				super.setRotationSpeed(state.speed, 
					() => this.service.getCharacteristic(this.Characteristic.RotationSpeed).updateValue(state.speed), false);

				changed = true;
			}

			if(state.direction != null && !isNaN(state.direction) && (!super.hasState('direction') || this.direction != state.direction))
			{
				super.setRotationDirection(state.direction, 
					() => this.service.getCharacteristic(this.Characteristic.RotationDirection).updateValue(state.direction), false);

				changed = true;
			}

			if(changed)
			{
				this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [' + this.getStateText() + '] ( ' + this.id + ' )');
			}

			this.AutomationSystem.LogikEngine.runAutomation(this, { value : this.value, speed : this.speed, direction : this.direction });
		}
	}

	setToCurrentState(state, callback)
	{
		const setState = (resolve) => {

			this.DeviceManager.setState(this, { value : this.tempState.value }).then((success) => {

				if(success)
				{
					super.setState(this.tempState.value);
				}

				if(callback != null)
				{
					callback(!success);
				}

				resolve();

				this.AutomationSystem.LogikEngine.runAutomation(this, { value : this.value, speed : this.speed, direction : this.direction });
			});
		};

		const setRotationSpeed = (resolve) => {

			this.DeviceManager.setState(this, { value : this.tempState.value, speed : this.tempState.speed }).then((success) => {

				if(success)
				{
					if(this.changedValue)
					{
						super.setState(this.tempState.value, null, false);
					}

					if(this.changedSpeed)
					{
						super.setRotationSpeed(this.tempState.speed, null, false);
					}

					this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [' + this.getStateText() + '] ( ' + this.id + ' )');
				}

				if(callback != null)
				{
					callback(!success);
				}

				resolve();

				this.AutomationSystem.LogikEngine.runAutomation(this, { value : this.value, speed : this.speed, direction : this.direction });
			});
		};

		const setRotationDirection = (resolve) => {

			this.DeviceManager.setState(this, { direction : this.tempState.direction }).then((success) => {

				if(success)
				{
					super.setRotationDirection(this.tempState.direction, null, true);
				}

				if(callback != null)
				{
					callback(!success);
				}

				resolve();

				this.AutomationSystem.LogikEngine.runAutomation(this, { value : this.value, speed : this.speed, direction : this.direction });
			});
		};

		super.setToCurrentState(state, (resolve) => {

			if(this.tempState.value)
			{
				setRotationSpeed(resolve);
			}
			else
			{
				setState(resolve);
			}

		}, (resolve) => {

			setRotationSpeed(resolve);

		}, (resolve) => {

			setRotationDirection(resolve);

		}, (resolve) => {

			if(callback != null)
			{
				callback(false);
			}

			resolve();
		});
	}
}