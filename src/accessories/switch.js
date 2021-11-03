const { SwitchService } = require('homebridge-syntex-dynamic-platform');

let Characteristic, AutomationSystem, DeviceManager;

module.exports = class SynTexSwitchService extends SwitchService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		Characteristic = manager.platform.api.hap.Characteristic;
		AutomationSystem = manager.AutomationSystem;
		DeviceManager = manager.DeviceManager;

		super(homebridgeAccessory, deviceConfig, serviceConfig, manager);

		this.controlAddress = serviceConfig.address.control;
		this.statusAddress = serviceConfig.address.status;

		super.getState((power) => {

			this.power = power || false;

		}, true);

		this.changeHandler = (state) =>
		{
			if(state.value != null)
			{
				this.service.getCharacteristic(Characteristic.On).updateValue(state.value);

				this.setState(state.value, () => {});
			}
		};
	}

	getState(callback)
	{
		super.getState((value) => {

			if(value != null)
			{
				this.power = value;
			}
				
			callback(null, this.power);

		}, true);
	}
	
	setState(value, callback)
	{
		DeviceManager.setState(this.controlAddress, { power : value }).then((success) => {

			if(success)
			{
				this.power = value;

				super.setState(this.power, 
					() => this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [' + this.power + '] ( ' + this.id + ' )'));
			
				if(DeviceManager.KNXInterface.connected)
				{
					DeviceManager.updateState(this.id, this.statusAddress, value ? 1 : 0);
				}

				AutomationSystem.LogikEngine.runAutomation(this.id, this.letters, { value });

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
		if(state.power != null && !isNaN(state.power) && this.power != state.power)
		{
			this.power = state.power;

			this.service.getCharacteristic(Characteristic.On).updateValue(this.power);

			super.setState(state.power,
				() => this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [' + this.power + '] ( ' + this.id + ' )'));
		
			AutomationSystem.LogikEngine.runAutomation(this.id, this.letters, { value : state.power });
		}
	}
};