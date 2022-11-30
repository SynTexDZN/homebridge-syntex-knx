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
        else
        {
            state.value = value;
        }

        for(const x in state)
        {
            var characteristic = this.TypeManager.getCharacteristic(x, { letters : service.letters });

            console.log(x, characteristic);

            if(characteristic != null)
            {
                if(typeof state[x] == 'boolean' && characteristic.format == 'number')
                {
                    if(state[x] == true)
                    {
                        state[x] = characteristic.max;
                    }
                    else
                    {
                        state[x] = characteristic.min;
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