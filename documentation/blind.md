# Blind

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
        "name": "KNX Blind Minimal", // No PositionState
        "services": [
            {
                "datapoint": {
                    "target": "5.001"
                },
                "address": {
                    "status": {
                        "target": "1/1/2"
                    },
                    "control": {
                        "target": "1/2/2"
                    }
                },
                "type": "blind"
            }
        ]
    },
    {
        "id": "knx1",
        "name": "KNX Blind", // PositionState Calculated With Value And Target
        "services": [
            {
                "datapoint": {
                    "value": "5.001",
                    "target": "5.001"
                },
                "address": {
                    "status": {
                        "value": "1/1/1",
                        "target": "1/1/2"
                    },
                    "control": {
                        "target": "1/2/2"
                    }
                },
                "type": "blind"
            }
        ]
    },
    {
        "id": "knx2",
        "name": "KNX Blind Boolean", // PositionState Calculated With Timeout
        "services": [
            {
                "datapoint": {
                    "target": "1.001"
                },
                "address": {
                    "status": {
                        "target": "1/1/3"
                    },
                    "control": {
                        "target": "1/2/3"
                    }
                },
                "delay": {
                    "up": 20000,
                    "down": 18000
                },
                "type": "blind"
            }
        ]
    }
]
```