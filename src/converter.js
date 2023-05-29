const convert = require('color-convert');

module.exports = class Converter
{
	constructor(DeviceManager)
	{
		this.TypeManager = DeviceManager.TypeManager;
	}

	getState(service, value)
	{
		var state = {}, type = this.TypeManager.letterToType(service.letters[0]);

		if(type == 'dimmer')
		{
			state.value = value > 0;
			state.brightness = value;
		}
		else if(type == 'rgb')
		{
			var converted = convert.rgb.hsv([value.red, value.green, value.blue]);

			state.value = value.red > 0 || value.green > 0 || value.blue > 0;

			if(converted != null)
			{
				state.hue = converted[0];
				state.saturation = converted[1];
				state.brightness = converted[2];
			}
		}
		else
		{
			state.value = value;
		}

		for(const x in state)
		{
			var characteristic = this.TypeManager.getCharacteristic(x, { letters : service.letters });

			if(characteristic != null)
			{
				if(typeof state[x] == 'boolean' && characteristic.format == 'number')
				{
					if(state[x] == true)
					{
						state[x] = 1;
					}
					else if(state[x] == false)
					{
						state[x] = 0;
					}
				}

				if(service.invertState)
				{
					if(typeof state[x] == 'boolean' && characteristic.format == 'boolean')
					{
						state[x] = !state[x];
					}
					else if(typeof state[x] == 'number' && characteristic.format == 'number')
					{
						state[x] = 100 - state[x];
					}
				}
			}
		}

		return state;
	}
}