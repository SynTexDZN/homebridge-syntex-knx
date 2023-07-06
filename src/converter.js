const convert = require('color-convert');

module.exports = class Converter
{
	constructor(DeviceManager)
	{
		this.DeviceManager = DeviceManager;

		this.TypeManager = DeviceManager.TypeManager;
	}

	getState(service, state = {})
	{
		var type = this.TypeManager.letterToType(service.letters[0]), dataPoints = service.dataPoint.status;

		for(const x in state)
		{
			var characteristic = this.TypeManager.getCharacteristic(x, { letters : service.letters });

			if(dataPoints instanceof Object && dataPoints[x] != null)
			{
				var dataPoint = dataPoints[x];

				if((dataPoint.startsWith('1.') || dataPoint.startsWith('2.')) && typeof state[x] == 'number')
				{
					state[x] = state[x] > 0;
				}

				if(dataPoint.startsWith('5.') && typeof state[x] == 'boolean')
				{
					if(state[x] == true)
					{
						state[x] = 1;
					}
					
					if(state[x] == false)
					{
						state[x] = 0;
					}
				}

				if(service.invertState)
				{
					if(dataPoint.startsWith('1.')
					|| dataPoint.startsWith('2.'))
					{
						state[x] = !state[x];
					}

					if(dataPoint == '5.001')
					{
						state[x] = 100 - state[x];
					}
					
					if(dataPoint == '5.003')
					{
						state[x] = 360 - state[x];
					}
					
					if(dataPoint == '5.004'
					|| dataPoint == '5.005'
					|| dataPoint == '5.006'
					|| dataPoint == '5.010'
					|| dataPoint == '5.100')
					{
						state[x] = 255 - state[x];
					}
				}
			}

			if(characteristic != null)
			{
				if(typeof state[x] == 'boolean' && characteristic.format == 'number')
				{
					if(state[x] == true)
					{
						state[x] = characteristic.max || 1;
					}
					else if(state[x] == false)
					{
						state[x] = characteristic.min || 0;
					}
				}

				if(typeof state[x] == 'number' && characteristic.format == 'boolean')
				{
					state[x] = state[x] > 0;
				}
			}
		}

		if(type == 'blind')
		{
			if(state.value != null)
			{
				state.value = 100 - state.value;
			}

			if(state.target != null)
			{
				state.target = 100 - state.target;
			}
		}

		if(type == 'dimmer')
		{
			if(state.value != null && service.statusAddress.brightness == null && typeof state.value == 'number')
			{
				state.brightness = state.value;
				
				state.value = state.brightness > 0;
			}

			if(state.brightness != null && service.statusAddress.value == null)
			{
				state.value = state.brightness > 0;
			}

			if(state.brightness == 0)
			{
				delete state.brightness;
			}
		}

		if(type == 'fan')
		{
			if(state.value != null && service.statusAddress.speed == null && typeof state.value == 'number')
			{
				state.speed = state.value;
				
				state.value = state.speed > 0;
			}

			if(state.speed != null && service.statusAddress.value == null)
			{
				state.value = state.speed > 0;
			}

			if(state.speed == 0)
			{
				delete state.speed;
			}
		}

		if(type == 'thermostat')
		{
			if(state.mode != null && dataPoints.mode == '1.100')
			{
				if(state.mode == 1)
				{
					state.mode = 1;
				}
				else if(state.mode == 0)
				{
					state.mode = 2;
				}
			}
		}

		if(type == 'rgb')
		{
			if(state.value != null)
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

		return state;
	}
}