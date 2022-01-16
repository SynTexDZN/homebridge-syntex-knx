const { UniversalAccessory } = require('homebridge-syntex-dynamic-platform');

const ContactService = require('./accessories/contact');
const SwitchService = require('./accessories/switch');
const LightService = require('./accessories/light');
const MotionService = require('./accessories/motion');
const TemperatureService = require('./accessories/temperature');
// const HumidityService = require('./accessories/humidity');
const LightBulbService = require('./accessories/lightBulb');
// const DimmedBulbService = require('./accessories/dimmedBulb');
// const ColoredBulbService = require('./accessories/coloredBulb');
// const LeakService = require('./accessories/leak');
const OutletService = require('./accessories/outlet');
const OccupancyService = require('./accessories/occupancy');
// const StatelessSwitchService = require('./accessories/statelessswitch');
// const SmokeService = require('./accessories/smoke');
// const AirQualityService = require('./accessories/airquality');

module.exports = class SynTexUniversalAccessory extends UniversalAccessory
{
	constructor(homebridgeAccessory, deviceConfig, manager)
	{
		super(homebridgeAccessory, deviceConfig, manager);
	}
	
	setService(config, subtype)
	{
		var serviceConfig = { name : this.name, type : config, subtype }, service = null;

		if(config instanceof Object)
		{
			for(const i in config)
			{
				serviceConfig[i] = config[i];
			}
		}

		if(Array.isArray(this.services) && this.services.length > 1 && this.name == serviceConfig.name)
		{
			serviceConfig.name = serviceConfig.name + ' ' + serviceConfig.type[0].toUpperCase() + serviceConfig.type.substring(1);

			if((JSON.stringify(this.services).match(new RegExp(serviceConfig.type, 'g')) || []).length > 1)
			{
				var letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

				serviceConfig.name += ' ' + letters[subtype];
			}
		}
        
		if(serviceConfig.type == 'contact')
		{
			service = new ContactService(this.homebridgeAccessory, this.deviceConfig, serviceConfig, this.manager);
		}
		else if(serviceConfig.type == 'switch')
		{
			service = new SwitchService(this.homebridgeAccessory, this.deviceConfig, serviceConfig, this.manager);
		}
		else if(serviceConfig.type == 'light')
		{
			service = new LightService(this.homebridgeAccessory, this.deviceConfig, serviceConfig, this.manager);
		}
		else if(serviceConfig.type == 'motion')
		{
			service = new MotionService(this.homebridgeAccessory, this.deviceConfig, serviceConfig, this.manager);
		}
		else if(serviceConfig.type == 'occupancy')
		{
			service = new OccupancyService(this.homebridgeAccessory, this.deviceConfig, serviceConfig, this.manager);
		}
		else if(serviceConfig.type == 'temperature')
		{
			service = new TemperatureService(this.homebridgeAccessory, this.deviceConfig, serviceConfig, this.manager);
		}/*
		else if(serviceConfig.type == 'humidity')
		{
			service = new HumidityService(this.homebridgeAccessory, this.deviceConfig, serviceConfig, this.manager);
		}*/
		else if(serviceConfig.type == 'led')
		{
			service = new LightBulbService(this.homebridgeAccessory, this.deviceConfig, serviceConfig, this.manager);
		}/*
		else if(serviceConfig.type == 'dimmer')
		{
			service = new DimmedBulbService(this.homebridgeAccessory, this.deviceConfig, serviceConfig, this.manager);
		}
		else if(serviceConfig.type == 'rgb')
		{
			service = new ColoredBulbService(this.homebridgeAccessory, this.deviceConfig, serviceConfig, this.manager);
		}
		else if(serviceConfig.type == 'rain')
		{
			service = new LeakService(this.homebridgeAccessory, this.deviceConfig, serviceConfig, this.manager);
		}*/
		else if(serviceConfig.type == 'outlet' || serviceConfig.type == 'relais')
		{
			service = new OutletService(this.homebridgeAccessory, this.deviceConfig, serviceConfig, this.manager);
		}/*
		else if(serviceConfig.type == 'statelessswitch')
		{
			service = new StatelessSwitchService(this.homebridgeAccessory, this.deviceConfig, serviceConfig, this.manager);
		}
		else if(serviceConfig.type == 'smoke')
		{
			service = new SmokeService(this.homebridgeAccessory, this.deviceConfig, serviceConfig, this.manager);
		}
		else if(serviceConfig.type == 'airquality')
		{
			service = new AirQualityService(this.homebridgeAccessory, this.deviceConfig, serviceConfig, this.manager);
		}
        */
		if(service != null)
		{
			this.service.push(service);
		}
	}
	
	getModel()
	{
		var name = 'Accessory';
		var sensors = ['airquality', 'contact', 'humidity', 'leak', 'motion', 'occupancy', 'smoke', 'temperature'];

		if(this.services != null)
		{
			name = this.services;
		}

		if(this.services instanceof Object && this.services.type != null)
		{
			name = this.services.type;
		}

		if(Array.isArray(this.services))
		{
			name = 'Multi Accessory';
		}

		name = name[0].toUpperCase() + name.substring(1);

		if(sensors.includes(name.toLowerCase()))
		{
			name += ' Sensor';
		}

		return 'KNX ' + name;
	}
};