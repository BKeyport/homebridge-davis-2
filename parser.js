class Parser {

  constructor(platform) {
    this.platform = platform;
    this.log = platform.log;
    this.txids = platform.txids;

    this.platform.logger.debug('Parser', 'Initialized');
  }

  parse(payload) {

    this.platform.logger.debug('Parser', 'Payload received');

    if (!payload?.data?.conditions) {
      this.platform.logger.debug('Parser', 'Invalid payload structure (missing conditions)');
      return null;
    }

    this.platform.logger.debug('Parser', 'Payload validated');

    const externalCandidates = [];
    let wlInternal = null;
    let air = null;

    this.platform.logger.debug('Parser', 'Scanning conditions array');

    for (const item of payload.data.conditions) {

      const type = item.data_structure_type;

      // External candidates (ISS + AirLink weather both allowed through)
      if (type === 1 || type === 6) {
        externalCandidates.push({
          type,
          temp: item.temp,
          humidity: item.hum
        });
      }

      // Internal weather
      if (type === 4) {
        wlInternal = {
          temp: item.temp_in,
          humidity: item.hum_in
        };
      }

      // Air quality (AirLink)
      if (type === 5 || type === 6) {
        air = {
          temp: item.temp,
          humidity: item.hum,
          pm2p5: item.pm_2p5 ?? item.pm_2p5_last,
          pm10: item.pm_10 ?? item.pm_10_last
        };
      }
    }

    this.platform.logger.debug('Parser', 'Condition scan complete');

    const result = {
      externalCandidates,
      internalTemperature: wlInternal?.temp ?? null,
      internalHumidity: wlInternal?.humidity ?? null,
      airQuality: air ? {
        pm2p5: air.pm2p5,
        pm10: air.pm10
      } : null
    };

    this.platform.logger.verbose(
      'Parser',
      'Final parsed output: %j',
      result
    );

    return result;
  }
}

module.exports = Parser;
