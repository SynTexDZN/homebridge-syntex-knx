# Thermostat

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
        "name": "KNX Thermostat Minimal",
        "services": [
            {
                "datapoint": {
                    "value": "9.001",
                    "target": "9.001"
                },
                "address": {
                    "status": {
                        "value": "1/1/1",
                        "target": "1/2/1"
                    },
                    "control": {
                        "target": "1/2/1"
                    }
                },
                "type": "thermostat"
            }
        ]
    },
    {
        "id": "knx1",
        "name": "KNX Thermostat",
        "services": [
            {
                "datapoint": {
                    "value": "9.001",
                    "target": "9.001",
                    "state": "1.011",
                    "mode": "1.100"
                },
                "address": {
                    "status": {
                        "value": "1/1/1",
                        "target": "1/2/1",
                        "state": "1/3/1",
                        "mode": "1/4/1"
                    },
                    "control": {
                        "target": "1/2/1",
                        "mode": "1/4/1"
                    }
                },
                "type": "thermostat"
            }
        ]
    },
    {
        "id": "knx2",
        "name": "KNX Thermostat Offset",
        "services": [
            {
                "datapoint": {
                    "value": "9.001",
                    "target": "9.001",
                    "state": "1.011",
                    "mode": "1.100",
                    "offset": "6.010"
                },
                "address": {
                    "status": {
                        "value": "1/1/1",
                        "target": "1/2/1",
                        "state": "1/3/1",
                        "mode": "1/4/1",
                        "offset": "1/5/1"
                    },
                    "control": {
                        "mode": "1/4/1",
                        "offset": "1/5/1"
                    }
                },
                "type": "thermostat"
            }
        ]
    }
]
```