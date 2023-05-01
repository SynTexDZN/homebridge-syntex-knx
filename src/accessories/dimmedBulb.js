const { DimmedBulbService } = require('homebridge-syntex-dynamic-platform');

module.exports = class SynTexDimmedBulbService extends DimmedBulbService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager);

		this.DeviceManager = manager.DeviceManager;

		this.dataPoint = serviceConfig.datapoint || 'DPT5.001';
		
		this.statusAddress = serviceConfig.address.status;
		this.controlAddress = serviceConfig.address.control;

		this.invertState = serviceConfig.inverted || false;

		this.changeHandler = (state) => {

			this.setToCurrentBrightness(state, (failed) => {

				if(!failed)
				{
					this.service.getCharacteristic(this.Characteristic.On).updateValue(this.value);
					this.service.getCharacteristic(this.Characteristic.Brightness).updateValue(this.brightness);
				}
			});
		};
	}

	getState(callback)
	{
		super.getState((value) => {

			if(super.hasState('value'))
			{
				this.value = value;

				this.logger.log('read', this.id, this.letters, '%read_state[0]% [' + this.name + '] %read_state[1]% [value: ' + value + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');

				callback(null, value);
			}
			else
			{
				this.DeviceManager.getState(this).then((state) => {

					if(state.value != null && !isNaN(state.value))
					{
						this.value = state.value;

						super.setState(state.value,
							() => this.logger.log('read', this.id, this.letters, '%read_state[0]% [' + this.name + '] %read_state[1]% [value: ' + state.value + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )'));
					}

					callback(null, this.value);
				});
			}
		});
	}

	setState(value, callback)
	{
		this.setToCurrentBrightness({ value }, (failed) => {

			if(!failed)
			{
				callback();
			}
			else
			{
				callback(new Error('Failed'));
			}
		});
	}

	getBrightness(callback)
	{
		super.getBrightness((brightness) => {

			if(super.hasState('brightness'))
			{
				this.brightness = brightness;

				callback(null, brightness);
			}
			else
			{
				this.DeviceManager.getState(this).then((state) => {

					if(state.brightness != null && !isNaN(state.brightness))
					{
						this.brightness = state.brightness;
						
						super.setBrightness(state.brightness, () => {});
					}
					
					callback(null, this.brightness);
				});
			}
		});
	}

	setBrightness(brightness, callback)
	{
		this.setToCurrentBrightness({ brightness }, (failed) => {

			if(!failed)
			{
				callback();
			}
			else
			{
				callback(new Error('Failed'));
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
				this.value = this.tempState.value = state.value;

				super.setState(state.value, 
					() => this.service.getCharacteristic(this.Characteristic.On).updateValue(state.value));

				changed = true;
			}

			if(state.brightness != null && !isNaN(state.brightness) && (!super.hasState('brightness') || this.brightness != state.brightness))
			{
				this.brightness = this.tempState.brightness = state.brightness;

				super.setBrightness(state.brightness, 
					() => this.service.getCharacteristic(this.Characteristic.Brightness).updateValue(state.brightness));

				changed = true;
			}
			
			if(changed)
			{
				this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [value: ' + this.value + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');
			}

			this.AutomationSystem.LogikEngine.runAutomation(this, { value : this.value, brightness : this.brightness });
		}
	}

	setToCurrentBrightness(state, callback)
	{
		/*
		const setPower = (resolve) => {

			this.DeviceManager.setState(this, this.tempState.value).then((success) => {

				if(success)
				{
					this.value = this.tempState.value;

					super.setState(this.value, () => {});

					this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [value: ' + this.value + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');
				}

				if(callback != null)
				{
					callback(this.offline);
				}

				resolve();

				this.AutomationSystem.LogikEngine.runAutomation(this, { value : this.value, brightness : this.brightness });
			});
		};
		*/
		const setBrightness = (resolve) => {

			this.DeviceManager.setState(this, this.tempState.value ? this.tempState.brightness : 0).then((success) => {

				if(success)
				{
					this.value = this.tempState.value;
					this.brightness = this.tempState.brightness;

					super.setState(this.value, () => {});
					super.setBrightness(this.brightness, () => {});

					this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [value: ' + this.value + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');
				}

				if(callback != null)
				{
					callback(this.offline);
				}

				resolve();

				this.AutomationSystem.LogikEngine.runAutomation(this, { value : this.value, brightness : this.brightness });
			});
		};

		super.setToCurrentBrightness(state, (resolve) => {

			setBrightness(resolve);

		}, (resolve) => {

			setBrightness(resolve);

		}, (resolve) => {

			if(callback != null)
			{
				callback(this.offline);
			}

			resolve();
		});
	}
}