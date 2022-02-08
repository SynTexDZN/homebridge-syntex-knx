const { OutletService } = require('homebridge-syntex-dynamic-platform');

let Characteristic, AutomationSystem, DeviceManager;

module.exports = class SynTexOutletService extends OutletService
{
	constructor(homebridgeAccessory, deviceConfig, serviceConfig, manager)
	{
		Characteristic = manager.platform.api.hap.Characteristic;
		AutomationSystem = manager.platform.AutomationSystem;
		DeviceManager = manager.DeviceManager;

		super(homebridgeAccessory, deviceConfig, serviceConfig, manager);

		this.dataPoint = 'DPT1.001';

		this.statusAddress = serviceConfig.address.status;
		this.controlAddress = serviceConfig.address.control;

		this.invertState = serviceConfig.inverted || false;

		super.getState((power) => {

			this.power = power || false;

			this.service.getCharacteristic(Characteristic.On).updateValue(this.power);

		}, true);

		this.changeHandler = (state) => {
			
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

				this.logger.log('read', this.id, this.letters, '%read_state[0]% [' + this.name + '] %read_state[1]% [' + this.power + '] ( ' + this.id + ' )');

				callback(null, this.power);
			}
			else
			{
				DeviceManager.getState(this).then((value) => {

					if(value != null && !isNaN(value))
					{
						this.power = value;

						this.logger.log('read', this.id, this.letters, '%read_state[0]% [' + this.name + '] %read_state[1]% [' + this.power + '] ( ' + this.id + ' )');
					
						super.setState(this.power, () => {});
					}

					callback(null, this.power);
				});
			}
		});
	}
	
	setState(value, callback)
	{
		DeviceManager.setState(this, value).then((success) => {

			if(success)
			{
				this.power = value;

				super.setState(this.power, 
					() => this.logger.log('update', this.id, this.letters, '%update_state[0]% [' + this.name + '] %update_state[1]% [' + this.power + '] ( ' + this.id + ' )'));
			
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