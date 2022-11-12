# Homebridge SynTex KNX
[![NPM Recommended Version](https://img.shields.io/npm/v/homebridge-syntex-knx?label=release&color=brightgree&style=for-the-badge)](https://www.npmjs.com/package/homebridge-syntex-knx)
[![NPM Beta Version](https://img.shields.io/npm/v/homebridge-syntex-knx/beta?color=orange&label=beta&style=for-the-badge)](https://www.npmjs.com/package/homebridge-syntex-knx)
[![NPM Downloads](https://img.shields.io/npm/dt/homebridge-syntex-knx?color=9944ee&&style=for-the-badge)](https://www.npmjs.com/package/homebridge-syntex-knx)
[![GitHub Commits](https://img.shields.io/github/commits-since/SynTexDZN/homebridge-syntex-knx/0.0.0?color=yellow&label=commits&style=for-the-badge)](https://github.com/SynTexDZN/homebridge-syntex-knx/commits)
[![GitHub Code Size](https://img.shields.io/github/languages/code-size/SynTexDZN/homebridge-syntex-knx?color=0af&style=for-the-badge)](https://github.com/SynTexDZN/homebridge-syntex-knx)

A simple plugin to control KNX devices.<br>
This plugin is made to cooperate with Homebridge: https://github.com/nfarina/homebridge<br>
It connects to a KNX IP Gateway and offers some special tweaks.


## Core Features
- **IP Gateway Connection:** Connect to your KNX IP Gateway trough your network.
- **Device Control:** View and control your KNX devices.
- **HTTP Access:** Update and read device states via HTTP calls.
- **Automation:** We integrated our powerful automation API for fast and complex automation.


## Troubleshooting
#### [![GitHub Issues](https://img.shields.io/github/issues-raw/SynTexDZN/homebridge-syntex-knx?logo=github&style=for-the-badge)](https://github.com/SynTexDZN/homebridge-syntex-knx/issues)
- `Report` us your `Issues`
- `Join` our `Discord Server`
#### [![Discord](https://img.shields.io/discord/442095224953634828?color=5865F2&logoColor=white&label=discord&logo=discord&style=for-the-badge)](https://discord.gg/XUqghtw4DE)


---


## Installation
1. Install homebridge using: `sudo npm install -g homebridge`
2. Install this plugin using: `sudo npm install -g homebridge-syntex-knx`
3. Update your `config.json` file. See snippet below.
4. Restart the Homebridge Service with: `sudo systemctl restart homebridge; sudo journalctl -fau homebridge`


## Example Config
**Info:** If the `baseDirectory` for the storage can't be created you have to do it by yourself and give it full write permissions!
- `sudo mkdir -p /var/homebridge/SynTex/` *( create the directory )*
- `sudo chown -R homebridge /var/homebridge/SynTex/` *( permissions only for homebridge )*
- `sudo chmod 777 -R homebridge /var/homebridge/SynTex/` *( permissions for many processes )*

```json
"platforms": [
	{
		"platform": "SynTexKNX",
		"baseDirectory": "/var/homebridge/SynTex",
		"ip": "192.168.1.100",
		"options": {
			"port": 1714,
			"language": "us",
			"disablePreload": false
		},
		"log": {
				"debug": false
		},
		"accessories": [
			{
				"id": "knx1",
				"name": "Control Accessory",
				"services": [
					{
						"address": {
							"status": ["1/1/0", "1/1/1"],
							"control": ["1/1/0", "1/1/1"]
						},
						"type": "switch"
					}
				]
			},
			{
				"id": "knx2",
				"name": "Sensor Accessory",
				"services": [
					{
						"address": {
							"status": "1/1/2"
						},
						"type": "motion"
					}
				]
			},
			{
				"id": "knx3",
				"name": "Window Covering Accessory",
				"services": [
					{
						"address": {
							"status": "1/2/0",
							"control": "1/2/0"
						},
						"delay": {
							"up": 11000,
							"down": 10000
						},
						"type": "blind",
						"name": "Up / Down"
					},
					{
						"address": {
							"status": "1/2/1",
							"control": "1/2/1"
						},
						"type": "switch",
						"name": "Stop"
					}
				]
			},
			{
				"id": "knx4",
				"name": "Inverted Accessory",
				"services": [
					{
						"datapoint": "1.001",
						"address": {
							"status": "1/1/3"
						},
						"type": "contact",
						"inverted": true
					}
				]
			},
			{
				"id": "knx5",
				"name": "Multi Accessory",
				"services": [
					{
						"address": {
							"status": "1/1/1",
							"control": "1/1/1"
						},
						"type": "switch",
						"name": "Switch"
					},
					{
						"address": {
							"status": "1/1/1",
							"control": "1/1/1"
						},
						"type": "led",
						"name": "LED"
					},
					{
						"address": {
							"status": "1/1/1",
							"control": "1/1/1"
						},
						"type": "outlet",
						"name": "Outlet"
					},
					{
						"address": {
							"status": "1/1/2"
						},
						"type": "motion",
						"name": "Motion"
					},
					{
						"address": {
							"status": "1/1/3"
						},
						"type": "contact",
						"name": "Contact"
					},
					{
						"address": {
							"status": "1/1/4"
						},
						"type": "occupancy",
						"name": "Occupancy"
					},
					{
						"address": {
							"status": "1/1/5"
						},
						"type": "temperature",
						"name": "Temperature"
					},
					{
						"address": {
							"status": "1/1/6"
						},
						"type": "light",
						"name": "Light"
					},
					{
						"address": {
							"status": "1/1/7"
						},
						"type": "humidity",
						"name": "Humidity"
					},
					{
						"address": {
							"status": "1/1/8"
						},
						"type": "leak",
						"name": "Leak"
					},
					{
						"address": {
							"status": "1/1/9"
						},
						"type": "smoke",
						"name": "Smoke"
					},
					{
						"datapoint": "5.001",
						"address": {
							"status": "1/2/2",
							"control": "1/2/3"
						},
						"delay": {
							"up": 11000,
							"down": 10000
						},
						"type": "blind",
						"name": "Blind"
					},
					{
						"datapoint": "1.001",
						"address": {
							"status": "1/1/1",
							"control": "1/1/1"
						},
						"type": "switch",
						"name": "Inverted Switch",
						"inverted": true
					}
				]
			}
		]
	}
]
```
### Required Parameters
- `platform` is always `SynTexKNX`
- `baseDirectory` The path where cache data is stored.
- `ip` The IP address of your KNX gateway.

### Optional Parameters
- `port` To control your accessory over HTTP calls.
- `language` You can use your country initials if you want to change it *( Currently supported: `us`, `en`, `de` )*
- `disablePreload` Disable reading device states after reboot *( prevents the bus from overflow )*

### Log Parameters
- Disable certain log level: `error`, `warn`, `info`, `read`, `update`, `success` and `debug` *( for example `debug: false` )*

### Accessory Config
- Every device needs these parameters: `id`, `name` and `services` *( required )*
- `id` has to be either a `physical group address` or another `random unique text` *( no duplicates! )*
- `name` could be anything.
- `services` see service config below.

### Service Config
- `type` should be one of these: `contact`, `blind`, `humidity`, `leak`, `led`, `light`, `motion`, `occupancy`, `outlet`, `rain`, `relais`, `smoke`, `switch`, `temperature`
- `address` must include your `status` and probably `control` group address / addresses from your knx system.
- You can customize group address datapoints by adding `datapoint` *( [KNX datapoint types](https://www.promotic.eu/en/pmdoc/Subsystems/Comm/PmDrivers/KNXDTypes.htm) )*
- For Boolean Devices you can add `inverted` *( inverts the state from `true` -> `false` / `false` -> `true` )*
- For Window Coverings you can add `delay` for `up` and `down` *( to calibrate the time it takes to open / close the covering )*


---


## SynTex UI
Control and set up your devices by installing `homebridge-syntex`<br>
This plugin is made for plugin management, automation system and device control.<br><br>

Check out the GitHub page for more information:<br>
https://github.com/SynTexDZN/homebridge-syntex


## Update KNX Devices
1. Open `http://`  **Bridge IP**  `/devices?id=`  **Device ID**  `&value=`  **New Value**
2. Insert the `Bridge IP` and `Device ID`
3. For the `New Value` you can type this pattern:
- For boolean devices: `true` / `false` *( switch, outlet, led )*
- For numeric devices: `10` / `12.4` *( blind, humidity, light, temperature )*
- For accessories with multiple service types add `&type=`  **SERVICETYPE**
- For accessories with multiple services with more than one of the same service type add `&counter=`  **SERVICENUMBER** 
*( First of that type = 0, second = 1 .. )*

**Example:**  `http://homebridge.local:1714/devices?id=ABCDEF1234567890&value=true&brightness=100`\
*( Updates the value and brightness of `ABCDEF1234567890` to `turned on, 100% brightness` for example )*


## Read KNX Device Values
1. Open `http://`  **Bridge IP**  `/devices?id=`  **Device ID**
2. Insert the `Bridge IP` and `Device ID`
- For accessories with multiple service types add `&type=`  **SERVICETYPE**
- For accessories with multiple services with more than one of the same service type add `&counter=`  **SERVICENUMBER** 
*( First of that type = 0, second = 1 .. )*

**Example:**  `http://homebridge.local:1714/devices?id=ABCDEF1234567890`\
*( Reads the value of `ABCDEF1234567890` for example )*


## Remove KNX Device
1. Open `http://`  **Bridge IP**  `/devices?id=`  **Device ID**  `&remove=CONFIRM`
2. Insert the `Bridge IP` and `Device ID`
- To remove a specific service add `&type=`  **SERVICETYPE**
- To remove a specific service from an accessory with more than one of the same service type add `&counter=`  **SERVICENUMBER**\
*( First of that type = 0, second = 1 .. )*

**Example:**  `http://homebridge.local:1714/devices?id=ABCDEF1234567890&remove=CONFIRM`\
*( Removes `ABCDEF1234567890` from the Config and Home App )*


---


## Automation
To enable the automation module you have to create a file named `automation.json` in your `baseDirectory >> automation` or install the `homebridge-syntex` plugin to create them via UI *( only between SynTex plugins )*<br><br>
**Example:**  For manual configuration update your `automation.json` file. See snippet below.   

```json
{
	"automation": [
		{
			"id": 0,
			"name": "Demo Automation",
			"active": true,
			"trigger": {
				"logic": "AND",
				"groups": [
					{
						"logic": "OR",
						"blocks": [
							{
								"id": "multi2",
								"name": "Multi Device",
								"letters": "F0",
								"plugin": "SynTexWebHooks",
								"operation": "<",
								"state": {
									"value": 1000
								}
							},
							{
								"operation": "=",
								"time": "16:00",
								"options": {
									"stateLock": true
								}
							}
						]
					},
					{
						"logic": "AND",
						"blocks": [
							{
								"id": "multi1",
								"name": "Multi Switch",
								"letters": "41",
								"plugin": "SynTexWebHooks",
								"operation": "=",
								"state": {
									"value": false
								},
								"options": {
									"stateLock": true
								}
							},
							{
								"operation": "=",
								"days": [
									1,
									2,
									3,
									4,
									5
								]
							}
						]
					}
				]
			},
			"result": [
				{
					"id": "knx5",
					"name": "Multi Accessory",
					"letters": "80",
					"plugin": "SynTexKNX",
					"operation": "=",
					"state": {
						"value": true
					}
				},
				{
					"id": "extern1",
					"name": "Extern Accessory",
					"letters": "40",
					"bridge": "192.168.1.100",
					"plugin": "SynTexWebHooks",
					"operation": "=",
					"state": {
						"value": false
					},
					"options": {
						"stateLock": false
					}
				},
				{
					"operation": "=",
					"delay": 1000
				},
				{
					"url": "http://192.168.1.100:1714/devices?id=knx1&value=true"
				}
			]
		}
	]
}
```

### Required Parameters
- `id` A unique ID of your automation.
- `name` The name of the automation.
- `active` Enable / disable a single automation.
- `trigger` What triggers the automation? *( See trigger configuration below )*
- `result` What happens when running an automation? *( See result configuration below )*

### Trigger Configuration
- `logic` Define a logical operation for your groups *( `AND`, `OR` )*
- `groups` Logical layer one *( See group configuration below )*

### Group Configuration
- `logic` Define a logical operation for your blocks *( `AND`, `OR` )*
- `blocks` Logical layer two *( See block configuration below )*

### Block Configuration
#### Service Block ( Trigger, Result )
- `id` is the same like in your config file *( or in your log )*
- `name` The name of the accessory.
- `letters` See letter configuration below.
- `bridge` IP of your other bridge.
- `plugin` Use the platform name of the plugin *( see supported plugins below )*
- `operation` Use the logical operands *( `>`, `<`, `=` )*
- `state` The state of your accessory *( see below )*<br>
	- `value` is used for the main characteristic.
	- `brightness` can be used for dimmable / RGB lights.
	- `hue` can be used for RGB lights.
	- `saturation` can be used for RGB lights.

#### Time Block ( Trigger )
- `time` Define a time point *( e.g. `16:00` )*
- `operation` Use the logical operands *( `>`, `<`, `=` )*

#### Weekday Block ( Trigger )
- `days` Set the weekdays *( from `0` to `6` )*
- `operation` Use the logical operands *( `=` )*

#### Delay Block ( Result )
- `delay` Set a timeout *( in milliseconds )*

#### URL Block ( Result )
- `url` Fetch an URL.

### Letter Configuration
The letters are split into two parts *( characters )*

**1. Service Type**
- 0 : Occupancy
- 1 : Smoke
- 2 : Airquality
- 3 : RGB
- 4 : Switch
- 5 : Relais
- 6 : Stateless Switch
- 7 : Outlet
- 8 : LED
- 9 : Dimmer
- A : Contact
- B : Motion
- C : Temperature
- D : Humidity
- E : Rain
- F : Light
- G : Blind

**2. Duplicate Counter**
- If there are more services of the same type the counter indicates which is which
- Simply count from top to bottom.

**Example:**  The first switch in your config has the letters `40`, the second `41` and so on ..

### Supported Plugins
- SynTexKNX *( `homebridge-syntex-knx` )*
- SynTexMagicHome *( `homebridge-syntex-magichome` )*
- SynTexTuya *( `homebridge-syntex-tuya` )*
- SynTexWebHooks *( `homebridge-syntex-webhooks` )*


---


## Currently Supported
- Contact Sensor
- Humidity Sensor
- Leak / Rain Sensor
- Light Sensor
- Motion Sensor
- Occupancy Sensor
- Smoke Sensor
- Temperature Sensor
- Switch / Relais / Outlet
- LED Light
- Blinds / Shutters / Window Coverings