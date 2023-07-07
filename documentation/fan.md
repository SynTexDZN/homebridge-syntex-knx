# Fan

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
        "name": "KNX Fan Minimal",
        "services": [
            {
                "datapoint": {
                    "value": "1.001",
                    "speed": "5.001"
                },
                "address": {
                    "status": {
                        "value": "1/1/1",
                        "speed": "1/2/1"
                    },
                    "control": {
                        "speed": "1/2/1"
                    }
                },
                "type": "fan"
            }
        ]
    },
    {
        "id": "knx1",
        "name": "KNX Fan",
        "services": [
            {
                "datapoint": {
                    "value": "1.001",
                    "speed": "5.001",
                    "direction": "1.001"
                },
                "address": {
                    "status": {
                        "value": "1/1/1",
                        "speed": "1/2/1",
                        "target": "1/3/1"
                    },
                    "control": {
                        "value": "1/1/1",
                        "speed": "1/2/1",
                        "target": "1/3/1"
                    }
                },
                "type": "fan"
            }
        ]
    }
]
```