const { ThermostatService } = require('homebridge-syntex-dynamic-platform');

module.exports = class SynTexThermostatService extends ThermostatService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, serviceConfig, manager);

		this.DeviceManager = manager.DeviceManager;

		this.dataPoint = serviceConfig.datapoint || { value : '9.001', target : '9.001', state : '1.001', mode : '1.001' };

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
		super.getTargetTemperature((value) => {

			if(super.hasState('target'))
			{
				this.target = value;

				callback(null, value);
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
					() => this.updateTarget(target), true);

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
		super.getCurrentHeatingCoolingState((value) => {

			if(super.hasState('state'))
			{
				this.state = value;

				callback(null, value);
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

	getTargetHeatingCoolingState(callback)
	{
		super.getTargetHeatingCoolingState((value) => {

			if(super.hasState('mode'))
			{
				this.mode = value;

				callback(null, value);
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
			this.updateTarget(this.target);

			this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [value: ' + this.value + ', target: ' + this.target + ', state: ' + this.state + ', mode: ' + this.mode + '] ( ' + this.id + ' )');
		}

		this.AutomationSystem.LogikEngine.runAutomation(this, { value : this.value, target : this.target, state : this.state, mode : this.mode });
	}

	updateTarget(value)
	{
		if(!(this.statusAddress instanceof Object) || this.statusAddress.state == null)
		{
			if(value > this.value)
			{
				this.service.getCharacteristic(this.Characteristic.CurrentHeatingCoolingState).updateValue(this.Characteristic.CurrentHeatingCoolingState.HEAT);
			}
			else
			{
				this.service.getCharacteristic(this.Characteristic.CurrentHeatingCoolingState).updateValue(this.Characteristic.CurrentHeatingCoolingState.OFF);
			}
		}
	}
};