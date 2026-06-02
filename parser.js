
class Parser {

  constructor(platform) {
    this.platform = platform;
    this.log = platform.log;
    this.txids = platform.txids;
  }

  parse(payload) {

    if (!payload?.data?.conditions) {
      this.log.warn("Parser received invalid payload");
      return null;
    }

    let wlExternal = null;
    let wlInternal = null;
    let air = null;

    for (const item of payload.data.conditions) {

      const type = item.data_structure_type;

      if (type === 1 && this.txids.includes(item.txid)) {

        wlExternal = {
          temp: item.temp,
          humidity: item.hum
        };

        this.log.debug(`External sensor matched txid=${item.txid}`);
      }

      if (type === 4) {

        wlInternal = {
          temp: item.temp_in,
          humidity: item.hum_in
        };

        this.log.debug("Indoor sensor parsed");
      }

      if (type === 5 || type === 6) {

        air = {
          temp: item.temp,
          humidity: item.hum,
          pm2p5: item.pm_2p5 ?? item.pm_2p5_last,
          pm10: item.pm_10 ?? item.pm_10_last
        };

        this.log.debug("AirLink sensor parsed");
      }
    }

    const result = {
      temperature: wlExternal?.temp ?? air?.temp ?? null,
      humidity: wlExternal?.humidity ?? air?.humidity ?? null,
      internalTemperature: wlInternal?.temp ?? null,
      internalHumidity: wlInternal?.humidity ?? null,
      airQuality: air ? {
        pm2p5: air.pm2p5,
        pm10: air.pm10
      } : null
    };

    this.log.debug("Parser output computed (RAW)");

    return result;
  }
}

module.exports = Parser;
