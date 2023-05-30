const convert = require('color-convert');

module.exports = class Converter
{
	constructor(DeviceManager)
	{
		this.TypeManager = DeviceManager.TypeManager;
	}

	getState(service, state = {})
	{
		var type = this.TypeManager.letterToType(service.letters[0]);

		if(state.value != null)
		{
			if(type == 'dimmer')
			{
				state.value = state.value > 0;
				state.brightness = state.value;
			}
			else if(type == 'rgb')
			{
				var converted = convert.rgb.hsv([state.value.red, state.value.green, state.value.blue]);

				state.value = state.value.red > 0 || state.value.green > 0 || state.value.blue > 0;

				if(converted != null)
				{
					state.hue = converted[0];
					state.saturation = converted[1];
					state.brightness = converted[2];
				}
			}
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