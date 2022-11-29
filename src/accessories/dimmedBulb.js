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
				this.DeviceManager.getState(this).then((value) => {

					if(value != null && !isNaN(value))
					{
						value = value > 0;

						this.value = value;

						super.setState(value,
							() => this.logger.log('read', this.id, this.letters, '%read_state[0]% [' + this.name + '] %read_state[1]% [value: ' + value + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )'));
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

				this.logger.log('read', this.id, this.letters, '%read_state[0]% [' + this.name + '] %read_state[1]% [value: ' + this.value + ', brightness: ' + brightness + '] ( ' + this.id + ' )');

				callback(null, brightness);
			}
			else
			{
				this.DeviceManager.getState(this).then((brightness) => {

					if(brightness != null && !isNaN(brightness))
					{
						this.brightness = brightness;

						super.setState(brightness,
							() => this.logger.log('read', this.id, this.letters, '%read_state[0]% [' + this.name + '] %read_state[1]% [value: ' + this.value + ', brightness: ' + brightness + '] ( ' + this.id + ' )'));
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
		if(state.value != null && !isNaN(state.value) && (!super.hasState('value') || this.value != state.value))
		{
			this.value = state.value > 0;
			this.brightness = state.value;

			super.setState(state.value > 0,
				() => this.service.getCharacteristic(this.Characteristic.On).updateValue(state.value > 0));

			super.setBrightness(state.value,
				() => this.service.getCharacteristic(this.Characteristic.Brightness).updateValue(state.value));
		}

		this.AutomationSystem.LogikEngine.runAutomation(this, { value : this.value, brightness : this.brightness });
	}

	setToCurrentBrightness(state, callback)
	{
		const setPower = (resolve) => {

			this.DeviceManager.setState(this, this.tempState.value).then((success) => {

				if(success)
				{
					this.value = this.tempState.value;
	
					super.setState(this.value, () => callback());

					this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [value: ' + this.value + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');
				}

				if(callback)
				{
					callback(this.offline);
				}

				resolve();

				this.AutomationSystem.LogikEngine.runAutomation(this, { value : this.value, brightness : this.brightness });
			});
		};

		const setBrightness = (resolve) => {

			this.DeviceManager.setState(this, this.tempState.brightness).then((success) => {

				if(success)
				{
					this.value = this.tempState.value;
					this.brightness = this.tempState.brightness;

					super.setState(this.value, () => {});
					super.setBrightness(this.brightness, () => {});

					this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [value: ' + this.value + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');
				}

				if(callback)
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

			if(callback)
			{
				callback(this.offline);
			}

			resolve();
		});
	}
};