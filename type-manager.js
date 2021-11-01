module.exports = class TypeManager
{
	constructor(logger)
	{
		this.logger = logger;

		this.types = ['contact', 'motion', 'temperature', 'humidity', 'rain', 'light', 'occupancy', 'smoke', 'airquality', 'rgb', 'switch', 'relais', 'statelessswitch', 'outlet', 'led', 'dimmer'];
		this.letters = ['A', 'B', 'C', 'D', 'E', 'F', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
	}

	letterToType(letter)
	{
		return this.types[this.letters.indexOf(letter.toUpperCase())];
	}

	typeToLetter(type)
	{
		return this.letters[this.types.indexOf(type.toLowerCase())];
	}
	
	validateUpdate(id, letters, state)
	{
		var data = {
			A : { type : 'contact', format : 'boolean' },
			B : { type : 'motion', format : 'boolean' },
			C : { type : 'temperature', format : 'number', min : -270, max : 100 },
			D : { type : 'humidity', format : 'number', min : 0, max : 100 },
			E : { type : 'rain', format : 'boolean' },
			F : { type : 'light', format : 'number', min : 0.0001, max : 100000 },
			0 : { type : 'occupancy', format : 'boolean' },
			1 : { type : 'smoke', format : 'boolean' },
			2 : { type : 'airquality', format : 'number', min : 0, max : 5 },
			3 : { type : 'rgb', format : { value : 'boolean', brightness : 'number', saturation : 'number', hue : 'number' }, min : { brightness : 0, saturation : 0, hue : 0 }, max : { brightness : 100, saturation : 100, hue : 360 } },
			4 : { type : 'switch', format : 'boolean' },
			5 : { type : 'relais', format : 'boolean' },
			6 : { type : 'statelessswitch', format : 'number' },
			7 : { type : 'outlet', format : 'boolean' },
			8 : { type : 'led', format : 'boolean' },
			9 : { type : 'dimmer', format : { value : 'boolean', brightness : 'number' }, min : { brightness : 0 }, max : { brightness : 100 } }
		};

		for(const i in state)
		{
			try
			{
				state[i] = JSON.parse(state[i]);
			}
			catch(e)
			{
				this.logger.log('warn', id, letters, '%conversion_error_parse[0]%: [' + state[i] + '] %conversion_error_parse[1]%! ( ' + id + ' )');

				return null;
			}
			
			var format = data[letters[0].toUpperCase()].format;

			if(format instanceof Object)
			{
				format = format[i];
			}

			if(typeof state[i] != format)
			{
				this.logger.log('warn', id, letters, '%conversion_error_format[0]%: [' + state[i] + '] %conversion_error_format[1]% ' + (format == 'boolean' ? '%conversion_error_format[2]%' : format == 'number' ? '%conversion_error_format[3]%' : '%conversion_error_format[4]%') + ' %conversion_error_format[5]%! ( ' + id + ' )');

				return null;
			}
			
			if(format == 'number')
			{
				var min = data[letters[0].toUpperCase()].min, max = data[letters[0].toUpperCase()].max;

				if(min instanceof Object)
				{
					min = min[i];
				}

				if(max instanceof Object)
				{
					max = max[i];
				}

				if(min != null && state[i] < min)
				{
					state[i] = min;
				}

				if(max != null && state[i] > max)
				{
					state[i] = max;
				}
			}
		}

		return state;
	}
};