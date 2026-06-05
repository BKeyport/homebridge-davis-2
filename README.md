# Homebridge Davis 2

This is a Homebridge plugin that allows you to integrate your Davis WeatherLink Live station and AirLink sensors.

<!-- [![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins) -->

---

## Manual Installation

You must have Homebridge already installed, then install the plugin:

npm install -g homebridge-davis-2

---

## GUI Installation

Search for: homebridge-davis-2

and install via Homebridge UI.

---

## How It Works

This plugin calls your Davis WeatherLink Live API and processes:

- External weather stations (ISS or AirLink fallback)
- Internal (console) temperature and humidity
- AirLink air quality data (PM2.5 / PM10)

The plugin polls the API on an interval and stores the latest valid state in memory for fast HomeKit updates.

---

## Configuration

This plugin uses graphical configuration in Homebridge UI.

### Fields

URL:  Your WeatherLink Live API endpoint (http://ip-address/v1/current_conditions)

Polling Interval:  How often the API is queried (in seconds) - I Recommend no shorter than 30 second cycles. 

Stale Threshold:  How long before data is considered invalid (in minutes)

Sensor Unit:  Temperature unit provided by your station (F or C)

TXIDs:  Allowed transmitter IDs (default: [1])

Checkboxes: 

Sensors:
External: Will enable temperature and humidity sensors from external stations.
Internal: Will enable temperature and humidity sensors from internal station.
AirLink:  This turns on the Air quality Indicator. 


Detailed Debug Logging: 
Enables deep debug output (payloads, state dumps)

---

## Notes

- Fetch errors are expected with Davis WeatherLink devices under load
- Logging is intentionally "noisy" in beta (Debug and Debug+ extremely so) 

---

## Known Behavior

- AirLink logic is untested due to lack of equipment. (main reason it's in beta) 
- Sensor availability depends on API response structure
- HomeKit accessories are dynamically created based on enabled flags

---

## Credits

Inspired by original module: homebridge-Davis (PMoon00 and others) 
All work by Brendan Keyport
(Assisted by ChatGPT to help understand concepts I was unable to understand alone) 


---

## Donation

Thank you for thinking of me, but I don't care to receive donations. 

In leiu of donations to me, please donate to a local underprivledged rights type charity. 

Disability rights, Gender equality, etc. 

Thank you for your consideration! 

