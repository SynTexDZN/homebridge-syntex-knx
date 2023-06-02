const { ColoredBulbService } = require('homebridge-syntex-dynamic-platform');

const convert = require('color-convert');

module.exports = class SynTexColoredBulbService extends ColoredBulbService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager);

		this.DeviceManager = manager.DeviceManager;

		this.dataPoint = serviceConfig.datapoint || '232.600';
		
		this.statusAddress = serviceConfig.address.status;
		this.controlAddress = serviceConfig.address.control;

		//this.invertState = serviceConfig.inverted || false;

		setInterval(() => {

			if(!this.running && (this.value != this.tempState.value || this.hue != this.tempState.hue || this.saturation != this.tempState.saturation || this.brightness != this.tempState.brightness))
			{
				this.setToCurrentColor({ ...this.tempState }, (failed) => {

					if(!failed)
					{
						this.service.getCharacteristic(this.Characteristic.On).updateValue(this.value);
						this.service.getCharacteristic(this.Characteristic.Hue).updateValue(this.hue);
						this.service.getCharacteristic(this.Characteristic.Saturation).updateValue(this.saturation);
						this.service.getCharacteristic(this.Characteristic.Brightness).updateValue(this.brightness);
					}
				});
			}

		}, 1000);

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

	getState(callback)
	{
		super.getState((value) => {

			if(super.hasState('value'))
			{
				this.value = value;

				this.logger.log('read', this.id, this.letters, '%read_state[0]% [' + this.name + '] %read_state[1]% [value: ' + this.value + ', hue: ' + this.hue +  ', saturation: ' + this.saturation + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');

				callback(null, this.value);
			}
			else
			{
				this.DeviceManager.getState(this).then((state) => {

					if(state.value != null && !isNaN(state.value))
					{
						this.value = state.value;

						super.setState(this.value,
							() => this.logger.log('read', this.id, this.letters, '%read_state[0]% [' + this.name + '] %read_state[1]% [value: ' + this.value + ', hue: ' + this.hue +  ', saturation: ' + this.saturation + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )'));
					}

					callback(null, this.value);
				});
			}
		});
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
				callback(new Error('Failed'));
			}
		});
	}

	getHue(callback)
	{
		super.getHue((hue) => {

			if(super.hasState('hue'))
			{
				this.hue = hue;

				callback(null, this.hue);
			}
			else
			{
				this.DeviceManager.getState(this).then((state) => {

					if(state.hue != null && !isNaN(state.hue))
					{
						this.hue = state.hue;
					
						super.setHue(this.hue, () => {});
					}
					
					callback(null, this.hue);
				});
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
				callback(new Error('Failed'));
			}
		});
	}

	getSaturation(callback)
	{
		super.getSaturation((saturation) => {

			if(super.hasState('saturation'))
			{
				this.saturation = saturation;

				callback(null, this.saturation);
			}
			else
			{
				this.DeviceManager.getState(this).then((state) => {

					if(state.saturation != null && !isNaN(state.saturation))
					{
						this.saturation = state.saturation;

						super.setSaturation(this.saturation, () => {});
					}
					
					callback(null, this.saturation);
				});
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

				callback(null, this.brightness);
			}
			else
			{
				this.DeviceManager.getState(this).then((state) => {

					if(state.brightness != null && !isNaN(state.brightness))
					{
						this.brightness = state.brightness;
						
						super.setBrightness(this.brightness, () => {});
					}
					
					callback(null, this.brightness);
				});
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

				super.setState(this.value, 
					() => this.service.getCharacteristic(this.Characteristic.On).updateValue(this.value));

				changed = true;
			}

			if(state.hue != null && !isNaN(state.hue) && (!super.hasState('hue') || this.hue != state.hue))
			{
				this.hue = this.tempState.hue = state.hue;

				super.setHue(this.hue,
					() => this.service.getCharacteristic(this.Characteristic.Hue).updateValue(this.hue));

				changed = true;
			}

			if(state.saturation != null && !isNaN(state.saturation) && (!super.hasState('saturation') || this.saturation != state.saturation))
			{
				this.saturation = this.tempState.saturation = state.saturation;

				super.setSaturation(this.saturation,
					() => this.service.getCharacteristic(this.Characteristic.Saturation).updateValue(this.saturation));

				changed = true;
			}

			if(state.brightness != null && !isNaN(state.brightness) && (!super.hasState('brightness') || this.brightness != state.brightness))
			{
				this.brightness = this.tempState.brightness = state.brightness;

				super.setBrightness(this.brightness, 
					() => this.service.getCharacteristic(this.Characteristic.Brightness).updateValue(this.brightness));

				changed = true;
			}
			
			if(changed)
			{
				this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [value: ' + this.value + ', hue: ' + this.hue +  ', saturation: ' + this.saturation + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');
			}

			this.AutomationSystem.LogikEngine.runAutomation(this, { value : this.value, hue : this.hue, saturation : this.saturation, brightness : this.brightness });
		}
	}

	setToCurrentColor(state, callback)
	{
		/*
		const setPower = (resolve) => {

			this.DeviceManager.setState(this, { value : this.tempState.value }).then((success) => {

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
		const setColor = (resolve) => {

			var converted = convert.hsv.rgb([this.tempState.hue, this.tempState.saturation, this.tempState.brightness]);

			if(converted != null)
			{
				this.DeviceManager.setState(this, { value : { red : converted[0], green : converted[1], blue : converted[2] } }).then((success) => {

					if(success)
					{
						this.value = this.tempState.value;
						this.hue = this.tempState.hue;
						this.saturation = this.tempState.saturation;
						this.brightness = this.tempState.brightness;

						super.setState(this.value, () => {});
						super.setHue(this.hue, () => {});
						super.setSaturation(this.saturation, () => {});
						super.setBrightness(this.brightness, () => {});

						this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [value: ' + this.value + ', hue: ' + this.hue +  ', saturation: ' + this.saturation + ', brightness: ' + this.brightness + '] ( ' + this.id + ' )');
					}

					if(callback != null)
					{
						callback(this.offline);
					}

					resolve();

					this.AutomationSystem.LogikEngine.runAutomation(this, { value : this.value, hue : this.hue, saturation : this.saturation, brightness : this.brightness });
				});
			}
			else
			{
				if(callback != null)
				{
					callback(this.offline);
				}

				resolve();
			}
		};

		super.setToCurrentColor(state, (resolve) => {

			setColor(resolve);

		}, (resolve) => {

			setColor(resolve);

		}, (resolve) => {

			if(callback != null)
			{
				callback(this.offline);
			}

			resolve();
		});
	}
}