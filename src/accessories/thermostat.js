const { ThermostatService } = require('homebridge-syntex-dynamic-platform');

module.exports = class SynTexThermostatService extends ThermostatService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager);

		this.base = super.getValue('base', false);
		this.offset = super.getValue('offset', false);

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

	updateState(state)
	{
		var changed = false;

		if(state.value != null && !isNaN(state.value) && (!super.hasState('value') || this.value != state.value))
		{
			super.setState(state.value, 
				() => this.service.getCharacteristic(this.Characteristic.CurrentTemperature).updateValue(state.value), false);

			changed = true;
		}

		if(state.target != null && !isNaN(state.target) && (!super.hasState('target') || this.target != state.target))
		{
			super.setTargetTemperature(state.target, 
				() => this.service.getCharacteristic(this.Characteristic.TargetTemperature).updateValue(state.target), false);

			changed = true;
		}

		state.state = this.updateCurrentState(state.state, state.mode || this.mode);

		if(state.state != null && !isNaN(state.state) && (!super.hasState('state') || this.state != state.state))
		{
			super.setCurrentHeatingCoolingState(state.state, 
				() => this.service.getCharacteristic(this.Characteristic.CurrentHeatingCoolingState).updateValue(state.state), false);

			changed = true;
		}

		if(state.mode != null && !isNaN(state.mode) && (!super.hasState('mode') || this.mode != state.mode))
		{
			super.setTargetHeatingCoolingState(state.mode, 
				() => this.service.getCharacteristic(this.Characteristic.TargetHeatingCoolingState).updateValue(state.mode), false);

			changed = true;
		}

		this.updateBase(state.target || this.target, state.offset || this.offset);

		if(changed)
		{
			this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [' + this.getStateText() + '] ( ' + this.id + ' )');
		}

		this.AutomationSystem.LogikEngine.runAutomation(this, { value : this.value, target : this.target, state : this.state, mode : this.mode });
	}

	updateTarget(target)
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

			super.setValue('base', this.base, false);
			super.setValue('offset', this.offset, false);
		}

		return target;
	}

	updateCurrentState(state, mode)
	{
		mode = this.updateMode(mode);

		if(state == 1)
		{
			if(mode == 0)
			{
				state = this.Characteristic.CurrentHeatingCoolingState.COOL;
			}
			else if(mode == 1)
			{
				state = this.Characteristic.CurrentHeatingCoolingState.HEAT;
			}
		}

		if(!(this.statusAddress instanceof Object) || this.statusAddress.state == null)
		{
			var currentState = this.Characteristic.CurrentHeatingCoolingState.OFF;

			if(mode == 0 && this.target < this.value)
			{
				currentState = this.Characteristic.CurrentHeatingCoolingState.COOL;
			}
			else if(mode == 1 && this.target > this.value)
			{
				currentState = this.Characteristic.CurrentHeatingCoolingState.HEAT;
			}

			if(!super.hasState('state') || this.state != currentState)
			{
				super.setCurrentHeatingCoolingState(currentState,
					() => this.service.getCharacteristic(this.Characteristic.CurrentHeatingCoolingState).updateValue(currentState));
			}
		}

		return state;
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
		const setTargetTemperature = (resolve) => {

			var converted = this.updateTarget(state.target);

			this.DeviceManager.setState(this, converted).then((success) => {

				if(success)
				{
					if(converted.offset != null)
					{
						this.offset = converted.offset;

						super.setValue('offset', this.offset, false);
					}

					super.setTargetTemperature(state.target,
						() => this.updateCurrentState(this.state, this.mode), true);
				}

				if(callback != null)
				{
					callback(!success);
				}

				resolve();

				this.AutomationSystem.LogikEngine.runAutomation(this, { value : this.value, target : this.target, state : this.state, mode : this.mode });
			});
		};

		const setTargetHeatingCoolingState = (resolve) => {

			this.DeviceManager.setState(this, { mode : this.updateMode(state.mode) }).then((success) => {

				if(success)
				{
					super.setTargetHeatingCoolingState(state.mode,
						() => this.updateCurrentState(this.state, this.mode), true);
				}

				if(callback != null)
				{
					callback(!success);
				}

				resolve();

				this.AutomationSystem.LogikEngine.runAutomation(this, { value : this.value, target : this.target, state : this.state, mode : this.mode });
			});
		};

		super.setToCurrentState(state, (resolve) => {

			setTargetTemperature(resolve);

		}, (resolve) => {

			setTargetHeatingCoolingState(resolve);

		}, (resolve) => {

			if(callback != null)
			{
				callback(false);
			}

			resolve();
		});
	}
};