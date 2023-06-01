const { ThermostatService } = require('homebridge-syntex-dynamic-platform');

module.exports = class SynTexThermostatService extends ThermostatService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager);

		this.DeviceManager = manager.DeviceManager;

		this.dataPoint = serviceConfig.datapoint || { value : '9.001', target : '9.001', state : '1.011', mode : '1.100' };

		this.statusAddress = serviceConfig.address.status;
		this.controlAddress = serviceConfig.address.control;
	}

	getState(callback)
	{
		super.getState((value) => {

			if(super.hasState('value'))
			{
				this.value = value;

				this.logger.log('read', this.id, this.letters, '%read_state[0]% [' + this.name + '] %read_state[1]% [value: ' + value + ', target: ' + this.target + ', state: ' + this.state + ', mode: ' + this.mode + '] ( ' + this.id + ' )');

				callback(null, value);
			}
			else
			{
				this.DeviceManager.getState(this).then((state) => {

					if(state.value != null && !isNaN(state.value))
					{
						this.value = state.value;

						super.setState(state.value,
							() => this.logger.log('read', this.id, this.letters, '%read_state[0]% [' + this.name + '] %read_state[1]% [value: ' + state.value + ', target: ' + this.target + ', state: ' + this.state + ', mode: ' + this.mode + '] ( ' + this.id + ' )'));
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

				callback(null, target);
			}
			else
			{
				this.DeviceManager.getState(this).then((state) => {

					if(state.target != null && !isNaN(state.target))
					{
						this.target = state.target;

						super.setTargetTemperature(state.target, () => {});
					}

					callback(null, this.target);
				});
			}
		});
	}

	setTargetTemperature(target, callback)
	{
		this.DeviceManager.setState(this, { target }).then((success) => {

			if(success)
			{
				this.target = target;

				super.setTargetTemperature(target,
					() => this.updateTarget(), true);

				callback();
			
				this.AutomationSystem.LogikEngine.runAutomation(this, { value : this.value, target : this.target, state : this.state, mode : this.mode });
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

				callback(null, state);
			}
			else
			{
				this.DeviceManager.getState(this).then((state) => {

					if(state.state != null && !isNaN(state.state))
					{
						this.state = state.state;

						super.setCurrentHeatingCoolingState(state.state, () => {});
					}

					callback(null, this.state);
				});
			}
		});
	}

	setTargetHeatingCoolingState(mode, callback)
	{
		this.DeviceManager.setState(this, { mode : this.updateMode(mode) }).then((success) => {

			if(success)
			{
				this.mode = mode;

				super.setTargetHeatingCoolingState(mode,
					() => this.updateTarget(), true);

				callback();
			
				this.AutomationSystem.LogikEngine.runAutomation(this, { value : this.value, target : this.target, state : this.state, mode : this.mode });
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

				callback(null, mode);
			}
			else
			{
				this.DeviceManager.getState(this).then((state) => {

					if(state.mode != null && !isNaN(state.mode))
					{
						this.mode = state.mode;

						super.setTargetHeatingCoolingState(state.mode, () => {});
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

			super.setState(state.value, 
				() => this.service.getCharacteristic(this.Characteristic.CurrentTemperature).updateValue(state.value));

			changed = true;
		}

		if(state.target != null && !isNaN(state.target) && (!super.hasState('target') || this.target != state.target))
		{
			this.target = state.target;

			super.setTargetTemperature(state.target, 
				() => this.service.getCharacteristic(this.Characteristic.TargetTemperature).updateValue(state.target));

			changed = true;
		}

		if(state.state != null && !isNaN(state.state) && (!super.hasState('state') || this.state != state.state))
		{
			this.state = state.state;

			super.setCurrentHeatingCoolingState(state.state, 
				() => this.service.getCharacteristic(this.Characteristic.CurrentHeatingCoolingState).updateValue(state.state));

			changed = true;
		}

		if(state.mode != null && !isNaN(state.mode) && (!super.hasState('mode') || this.mode != state.mode))
		{
			this.mode = state.mode;

			super.setTargetHeatingCoolingState(state.mode, 
				() => this.service.getCharacteristic(this.Characteristic.TargetHeatingCoolingState).updateValue(state.mode));

			changed = true;
		}
		
		if(changed)
		{
			this.updateTarget();

			this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [value: ' + this.value + ', target: ' + this.target + ', state: ' + this.state + ', mode: ' + this.mode + '] ( ' + this.id + ' )');
		}

		this.AutomationSystem.LogikEngine.runAutomation(this, { value : this.value, target : this.target, state : this.state, mode : this.mode });
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
};