const { ThermostatService } = require('homebridge-syntex-dynamic-platform');

module.exports = class SynTexThermostatService extends ThermostatService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager);

		this.base = super.getValue('base');
		this.offset = super.getValue('offset');

		this.DeviceManager = manager.DeviceManager;

		this.dataPoint = serviceConfig.datapoint || { value : '9.001', target : '9.001', state : '1.011', mode : '1.100', offset : '6.010' };

		this.statusAddress = serviceConfig.address.status;
		this.controlAddress = serviceConfig.address.control;

		this.changeHandler = (state) => {

			this.setToCurrentState(state, (failed) => {

				if(!failed)
				{
					this.service.getCharacteristic(this.Characteristic.TargetTemperature).updateValue(this.target);
					this.service.getCharacteristic(this.Characteristic.TargetHeatingCoolingState).updateValue(this.mode);
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

				this.logger.log('read', this.id, this.letters, '%read_state[0]% [' + this.name + '] %read_state[1]% [value: ' + this.value + ', target: ' + this.target + ', state: ' + this.state + ', mode: ' + this.mode + '] ( ' + this.id + ' )');

				callback(null, this.value);
			}
			else
			{
				this.DeviceManager.getState(this).then((state) => {

					if(state.value != null && !isNaN(state.value))
					{
						this.value = state.value;

						super.setState(this.value,
							() => this.logger.log('read', this.id, this.letters, '%read_state[0]% [' + this.name + '] %read_state[1]% [value: ' + this.value + ', target: ' + this.target + ', state: ' + this.state + ', mode: ' + this.mode + '] ( ' + this.id + ' )'));
					}

					callback(null, this.value);
				});
			}
		});
	}

	getTargetTemperature(callback)
	{
		super.getTargetTemperature((target) => {

			if(super.hasState('target'))
			{
				this.target = target;

				callback(null, this.target);
			}
			else
			{
				this.DeviceManager.getState(this).then((state) => {

					if(state.target != null && !isNaN(state.target))
					{
						this.target = this.updateBase(state.target, state.offset);

						super.setTargetTemperature(this.target, () => this.updateTarget());
					}

					callback(null, this.target);
				});
			}
		});
	}

	setTargetTemperature(target, callback)
	{
		this.setToCurrentState({ target }, (failed) => {

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

	getCurrentHeatingCoolingState(callback)
	{
		super.getCurrentHeatingCoolingState((state) => {

			if(super.hasState('state'))
			{
				this.state = state;

				callback(null, this.state);
			}
			else
			{
				this.DeviceManager.getState(this).then((state) => {

					if(state.state != null && !isNaN(state.state))
					{
						this.state = state.state;

						super.setCurrentHeatingCoolingState(this.state, () => {});
					}

					callback(null, this.state);
				});
			}
		});
	}

	setTargetHeatingCoolingState(mode, callback)
	{
		this.setToCurrentState({ mode }, (failed) => {

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

	getTargetHeatingCoolingState(callback)
	{
		super.getTargetHeatingCoolingState((mode) => {

			if(super.hasState('mode'))
			{
				this.mode = mode;

				callback(null, this.mode);
			}
			else
			{
				this.DeviceManager.getState(this).then((state) => {

					if(state.mode != null && !isNaN(state.mode))
					{
						this.mode = state.mode;

						super.setTargetHeatingCoolingState(this.mode, () => {});
					}

					callback(null, this.mode);
				});
			}
		});
	}

	updateState(state)
	{
		var changed = false;

		if(state.value != null && !isNaN(state.value) && (!super.hasState('value') || this.value != state.value))
		{
			this.value = state.value;

			super.setState(this.value, 
				() => this.service.getCharacteristic(this.Characteristic.CurrentTemperature).updateValue(this.value));

			changed = true;
		}

		if(state.target != null && !isNaN(state.target) && (!super.hasState('target') || this.target != state.target))
		{
			this.target = state.target;

			super.setTargetTemperature(this.target, 
				() => this.service.getCharacteristic(this.Characteristic.TargetTemperature).updateValue(this.target));

			changed = true;
		}

		if(state.state != null && !isNaN(state.state) && (!super.hasState('state') || this.state != state.state))
		{
			this.state = state.state;

			super.setCurrentHeatingCoolingState(this.state, 
				() => this.service.getCharacteristic(this.Characteristic.CurrentHeatingCoolingState).updateValue(this.state));

			changed = true;
		}

		if(state.mode != null && !isNaN(state.mode) && (!super.hasState('mode') || this.mode != state.mode))
		{
			this.mode = state.mode;

			super.setTargetHeatingCoolingState(this.mode, 
				() => this.service.getCharacteristic(this.Characteristic.TargetHeatingCoolingState).updateValue(this.mode));

			changed = true;
		}

		this.updateBase(state.target || this.target, state.offset || this.offset);

		if(changed)
		{
			this.updateTarget();

			this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [value: ' + this.value + ', target: ' + this.target + ', state: ' + this.state + ', mode: ' + this.mode + '] ( ' + this.id + ' )');
		}

		this.AutomationSystem.LogikEngine.runAutomation(this, { value : this.value, target : this.target, state : this.state, mode : this.mode });
	}

	convertOffset(target)
	{
		var state = { target };

		if(this.controlAddress instanceof Object && this.controlAddress.offset != null && target != null)
		{
			state.offset = (target - this.base) / 0.5;
		}

		return state;
	}

	updateBase(target, offset)
	{
		if(offset != null && !isNaN(offset))
		{
			this.base = target - (offset * 0.5);
			this.offset = offset;

			super.setValue('base', this.base);
			super.setValue('offset', this.offset);
		}

		return target;
	}

	updateTarget()
	{
		if(!(this.statusAddress instanceof Object) || this.statusAddress.state == null)
		{
			var mode = this.updateMode(this.mode);

			if(mode == 0 && this.target < this.value)
			{
				this.service.getCharacteristic(this.Characteristic.CurrentHeatingCoolingState).updateValue(this.Characteristic.CurrentHeatingCoolingState.COOL);
			}
			else if(mode == 1 && this.target > this.value)
			{
				this.service.getCharacteristic(this.Characteristic.CurrentHeatingCoolingState).updateValue(this.Characteristic.CurrentHeatingCoolingState.HEAT);
			}
			else
			{
				this.service.getCharacteristic(this.Characteristic.CurrentHeatingCoolingState).updateValue(this.Characteristic.CurrentHeatingCoolingState.OFF);
			}
		}
	}

	updateMode(mode)
	{
		if(mode == this.Characteristic.TargetHeatingCoolingState.COOL)
		{
			mode = 0;
		}
		else if(mode == this.Characteristic.TargetHeatingCoolingState.HEAT)
		{
			mode = 1;
		}
		else if(mode == this.Characteristic.TargetHeatingCoolingState.AUTO)
		{
			if(this.target <= this.value)
			{
				mode = 0;
			}
			else
			{
				mode = 1;
			}
		}

		return mode;
	}

	setToCurrentState(state, callback)
	{
		const setTargetTemperature = () => {

			return new Promise((resolve) => {

				var converted = this.convertOffset(state.target);

				this.DeviceManager.setState(this, converted).then((success) => {

					if(success)
					{
						this.target = state.target;
		
						super.setTargetTemperature(this.target,
							() => this.updateTarget());
							
						if(converted.offset != null)
						{
							this.offset = converted.offset;

							super.setValue('offset', this.offset);
						}
					}

					resolve(success);
				});
			});
		};

		const setTargetHeatingCoolingState = () => {

			return new Promise((resolve) => {

				this.DeviceManager.setState(this, { mode : this.updateMode(state.mode) }).then((success) => {

					if(success)
					{
						this.mode = state.mode;
		
						super.setTargetHeatingCoolingState(this.mode,
							() => this.updateTarget());
					}

					resolve(success);
				});
			});
		};

		var promiseArray = [];

		if(state.target != null && (!super.hasState('target') || this.target != state.target))
		{
			promiseArray.push(setTargetTemperature());
		}

		if(state.mode != null && (!super.hasState('mode') || this.mode != state.mode))
		{
			promiseArray.push(setTargetHeatingCoolingState());
		}

		if(promiseArray.length > 0)
		{
			Promise.all(promiseArray).then((result) => {

				if(callback != null)
				{
					callback(result.includes(false));
				}

				this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [value: ' + this.value + ', target: ' + this.target + ', state: ' + this.state + ', mode: ' + this.mode + '] ( ' + this.id + ' )');

				this.AutomationSystem.LogikEngine.runAutomation(this, { value : this.value, target : this.target, state : this.state, mode : this.mode });
			});
		}
		else if(callback != null)
		{
			callback(false);
		}
	}
};