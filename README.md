# Homebridge SynTex KNX
A simple plugin to control KNX devices.<br>
This plugin is made to cooperate with Homebridge: https://github.com/nfarina/homebridge<br>
It stores accessory data you can request to display the content on your website / app.

[![NPM Recommended Version](https://img.shields.io/npm/v/homebridge-syntex-knx?label=release&color=brightgreen)](https://www.npmjs.com/package/homebridge-syntex-knx)
[![NPM Beta Version](https://img.shields.io/npm/v/homebridge-syntex-knx/beta?color=orange&label=beta)](https://www.npmjs.com/package/homebridge-syntex-knx)
[![GitHub Commits](https://badgen.net/github/commits/SynTexDZN/homebridge-syntex-knx?color=yellow)](https://github.com/SynTexDZN/homebridge-syntex-knx/commits)
[![NPM Downloads](https://badgen.net/npm/dt/homebridge-syntex-knx?color=purple)](https://www.npmjs.com/package/homebridge-syntex-knx)
[![GitHub Code Size](https://img.shields.io/github/languages/code-size/SynTexDZN/homebridge-syntex-knx?color=0af)](https://github.com/SynTexDZN/homebridge-syntex-knx)
[![Discord](https://img.shields.io/discord/442095224953634828?color=728ED5&label=discord)](https://discord.gg/XUqghtw4DE)

<br>

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

```
"platforms": [
    {
        "platform": "SynTexKNX",
        "ip": "192.168.188.88",
        "port": 1714,
        "baseDirectory": "/var/homebridge/SynTex",
        "accessories": [
            {
                "id": "knx1",
                "name": "Demo",
                "services": [
                    {
                        "address": {
                            "status": "1/1/1",
                            "control": "1/1/1"
                        },
                        "type": "switch"
                    }
                ]
            }
        ]
    }
]
```


---


## Currently Supported
- Contact Sensor
- Switch / Relais / Outlet
- LED Lights