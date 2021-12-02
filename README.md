# Homebridge SynTex KNX
[![NPM Recommended Version](https://img.shields.io/npm/v/homebridge-syntex-knx?label=release&color=brightgree&style=for-the-badge)](https://www.npmjs.com/package/homebridge-syntex-knx)
[![NPM Beta Version](https://img.shields.io/npm/v/homebridge-syntex-knx/beta?color=orange&label=beta&style=for-the-badge)](https://www.npmjs.com/package/homebridge-syntex-knx)
[![NPM Downloads](https://img.shields.io/npm/dt/homebridge-syntex-knx?color=9944ee&&style=for-the-badge)](https://www.npmjs.com/package/homebridge-syntex-knx)
[![GitHub Commits](https://img.shields.io/github/commits-since/SynTexDZN/homebridge-syntex-knx/0.0.0?color=yellow&label=commits&style=for-the-badge)](https://github.com/SynTexDZN/homebridge-syntex-knx/commits)
[![GitHub Code Size](https://img.shields.io/github/languages/code-size/SynTexDZN/homebridge-syntex-knx?color=0af&style=for-the-badge)](https://github.com/SynTexDZN/homebridge-syntex-knx)

A simple plugin to control KNX devices.<br>
This plugin is made to cooperate with Homebridge: https://github.com/nfarina/homebridge<br>
It stores accessory data you can request to display the content on your website / app.


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
    "ip": "192.168.188.88",
    "port": 1714,
    "language": "us",
    "debug": false,
    "accessories": [
      {
        "id": "knx1",
        "name": "Switch",
        "services": [
          {
            "address": {
              "status": "1/1/1",
              "control": "1/1/1"
            },
            "type": "switch"
          }
        ]
      },
      {
        "id": "knx2",
        "name": "Light",
        "services": [
          {
            "address": {
              "status": "1/1/2",
              "control": "1/1/2"
            },
            "type": "led"
          }
        ]
      },
      {
        "id": "knx3",
        "name": "Outlet",
        "services": [
          {
            "address": {
              "status": "1/1/3",
              "control": "1/1/3"
            },
            "type": "outlet"
          }
        ]
      },
      {
        "id": "knx4",
        "name": "Contact",
        "services": [
          {
            "address": {
              "status": "1/1/4",
              "control": "1/1/4"
            },
            "type": "contact"
          }
        ]
      },
      {
        "id": "knx5",
        "name": "Motion",
        "services": [
          {
            "address": {
              "status": "1/1/5",
              "control": "1/1/5"
            },
            "type": "motion"
          }
        ]
      },
      {
        "id": "knx6",
        "name": "Inverted Accessory",
        "services": [
          {
            "address": {
              "status": "1/1/6",
              "control": "1/1/6"
            },
            "type": "switch",
            "inverted": true
          }
        ]
      },
      {
        "id": "knx7",
        "name": "Multi Device",
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
              "status": "1/1/2",
              "control": "1/1/2"
            },
            "type": "led",
            "name": "LED"
          },
          {
            "address": {
              "status": "1/1/3",
              "control": "1/1/3"
            },
            "type": "outlet",
            "name": "Outlet"
          },
          {
            "address": {
              "status": "1/1/4",
              "control": "1/1/4"
            },
            "type": "contact",
            "name": "Contact"
          },
          {
            "address": {
              "status": "1/1/5",
              "control": "1/1/5"
            },
            "type": "motion",
            "name": "Motion"
          },
          {
            "address": {
              "status": "1/1/6",
              "control": "1/1/6"
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
- `debug` For further information because of troubleshooting and bug reports.

### Accessory Config
- Every device needs these parameters: `id`, `name` and `services` *( required )*
- `id` has to be either a `real group address` or another `random unique text` *( no duplicates! )*
- `name` could be anything.
- `services` Should be one of these: `motion`, `contact`, `switch`, `relais`, `outlet`, `led`

### Service Config
- For Boolean Devices you can add `inverted` *( inverts the state from `true` -> `false` / `false` -> `true` )*


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
- For all devices: `true` / `false` *( outlet, switch, light, dimmable light )*
- For dimmable lights add `&brightness=`  **New Brightness** *( has to be a number )*

**Example:**  `http://homebridge.local:1714/devices?id=ABCDEF1234567890&value=true&brightness=100`\
*( Updates the value and brightness of `ABCDEF1234567890` to `turned on, 100% brightness` as example )*


## Read KNX Device Values
1. Open `http://`  **Bridge IP**  `/devices?id=`  **Device ID**
2. Insert the `Bridge IP` and `Device ID`

**Example:**  `http://homebridge.local:1714/devices?id=ABCDEF1234567890`\
*( Reads the value of `ABCDEF1234567890` as example )*


## Remove KNX Device
1. Open `http://`  **Bridge IP**  `/devices?id=`  **Device ID**  `&remove=CONFIRM`
2. Insert the `Bridge IP` and `Device ID`

**Example:**  `http://homebridge.local:1714/devices?id=ABCDEF1234567890&remove=CONFIRM`\
*( Removes `ABCDEF1234567890` from the Home app )*


---


## Currently Supported
- Contact Sensor
- Motion Sensor
- Switch / Relais / Outlet
- LED Lights
