# Dimmed Bulb

#### This feature is only available in the newest beta!
[![NPM Beta Version](https://img.shields.io/npm/v/homebridge-syntex-knx/beta?color=orange&label=beta&style=for-the-badge)](https://www.npmjs.com/package/homebridge-syntex-knx)

## Troubleshooting
#### [![GitHub Issues](https://img.shields.io/github/issues-raw/SynTexDZN/homebridge-syntex-knx?logo=github&style=for-the-badge)](https://github.com/SynTexDZN/homebridge-syntex-knx/issues)
- `Report` us your `Issues`
- `Join` our `Discord Server`
#### [![Discord](https://img.shields.io/discord/442095224953634828?color=5865F2&logoColor=white&label=discord&logo=discord&style=for-the-badge)](https://discord.gg/XUqghtw4DE)


---


## Example Config
```json
[
    {
        "id": "knx0",
        "name": "KNX Dimmer Minimal",
        "services": [
            {
                "datapoint": {
                    "brightness": "5.001"
                },
                "address": {
                    "status": {
                        "brightness": "1/1/2"
                    },
                    "control": {
                        "brightness": "1/2/2"
                    }
                },
                "type": "dimmer"
            }
        ]
    },
    {
        "id": "knx1",
        "name": "KNX Dimmer",
        "services": [
            {
                "datapoint": {
                    "value": "1.001",
                    "brightness": "5.001"
                },
                "address": {
                    "status": {
                        "value": "1/1/1",
                        "brightness": "1/1/2"
                    },
                    "control": {
                        "value": "1/2/1",
                        "brightness": "1/2/2"
                    }
                },
                "type": "dimmer"
            }
        ]
    }
]
```