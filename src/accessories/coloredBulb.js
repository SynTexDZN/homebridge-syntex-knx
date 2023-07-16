const { ColoredBulbService } = require('homebridge-syntex-dynamic-platform');

const convert = require('color-convert');

module.exports = class SynTexColoredBulbService extends ColoredBulbService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager);

		this.DeviceManager = manager.DeviceManager;

		this.dataPoint = this.DeviceManager.convertDataPoint({ value : '232.600' }, serviceConfig.datapoint);
		
		this.statusAddress = serviceConfig.address.status;
		this.controlAddress = serviceConfig.address.control;

		//this.invertState = serviceConfig.inverted || false;

		this.changeHandler = (state) => {

			this.setToCurrentColor(state, (failed) => {

				if(!failed)
				{
					this.service.getCharacteristic(this.Characteristic.On).updateValue(this.value);
					this.service.getCharacteristic(this.Characteristic.Hue).updateValue(this.hue);
					this.service.getCharacteristic(this.Characteristic.Saturation).updateValue(this.saturation);
					this.service.getCharacteristic(this.Characteristic.Brightness).updateValue(this.brightness);
				}
			});
		};
	}

	setState(value, callback)
	{
		this.setToCurrentColor({ value }, (failed) => {

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

	setHue(hue, callback)
	{
		this.setToCurrentColor({ hue }, (failed) => {
			
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

	setSaturation(saturation, callback)
	{
		this.setToCurrentColor({ saturation }, (failed) => {
			
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

	setBrightness(brightness, callback)
	{
		this.setToCurrentColor({ brightness }, (failed) => {

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
				this.tempState.value = state.value;

				super.setState(state.value, 
					() => this.service.getCharacteristic(this.Characteristic.On).updateValue(state.value), false);

				changed = true;
			}

			if(state.hue != null && !isNaN(state.hue) && (!super.hasState('hue') || this.hue != state.hue))
			{
				this.tempState.hue = state.hue;

				super.setHue(state.hue,
					() => this.service.getCharacteristic(this.Characteristic.Hue).updateValue(state.hue), false);

				changed = true;
			}

			if(state.saturation != null && !isNaN(state.saturation) && (!super.hasState('saturation') || this.saturation != state.saturation))
			{
				this.tempState.saturation = state.saturation;

				super.setSaturation(state.saturation,
					() => this.service.getCharacteristic(this.Characteristic.Saturation).updateValue(state.saturation), false);

				changed = true;
			}

			if(state.brightness != null && !isNaN(state.brightness) && (!super.hasState('brightness') || this.brightness != state.brightness))
			{
				this.tempState.brightness = state.brightness;

				super.setBrightness(state.brightness, 
					() => this.service.getCharacteristic(this.Characteristic.Brightness).updateValue(state.brightness), false);

				changed = true;
			}
			
			if(changed)
			{
				this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [' + this.getStateText() + '] ( ' + this.id + ' )');
			}

			this.AutomationSystem.LogikEngine.runAutomation(this, { value : this.value, hue : this.hue, saturation : this.saturation, brightness : this.brightness });
		}
	}

	setToCurrentColor(state, callback)
	{
		const setPower = (resolve) => {

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

				this.AutomationSystem.LogikEngine.runAutomation(this, { value : this.value, hue : this.hue, saturation : this.saturation, brightness : this.brightness });
			});
		};

		const setColor = (resolve) => {

			var converted = convert.hsv.rgb([this.tempState.hue, this.tempState.saturation, this.tempState.brightness]);

			if(converted != null)
			{
				this.DeviceManager.setState(this, { value : { red : converted[0], green : converted[1], blue : converted[2] } }).then((success) => {

					if(success)
					{
						if(this.changedValue)
						{
							super.setState(this.tempState.value, null, false);
						}

						if(this.changedColor)
						{
							super.setHue(this.tempState.hue, null, false);
							super.setSaturation(this.tempState.saturation, null, false);
							super.setBrightness(this.tempState.brightness, null, false);
						}
						
						this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [' + this.getStateText() + '] ( ' + this.id + ' )');
					}

					if(callback != null)
					{
						callback(!success);
					}

					resolve();

					this.AutomationSystem.LogikEngine.runAutomation(this, { value : this.value, hue : this.hue, saturation : this.saturation, brightness : this.brightness });
				});
			}
			else
			{
				if(callback != null)
				{
					callback(true);
				}

				resolve();
			}
		};

		super.setToCurrentColor(state, (resolve) => {

			if(this.tempState.value)
			{
				setColor(resolve);
			}
			else
			{
				setPower(resolve);
			}

		}, (resolve) => {

			setColor(resolve);

		}, (resolve) => {

			if(callback != null)
			{
				callback(false);
			}

			resolve();
		});
	}
}