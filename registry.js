class Registry {

  constructor(platform) {

    this.platform = platform;
    this.log = platform.log;

    this.staleAfterSeconds = platform.staleAfterSeconds;
    this.inputTemperatureUnit = platform.inputTemperatureUnit;

    this.platform.logger.debug(
      'Registry',
      'Input temperature unit configured as: %s',
      this.inputTemperatureUnit
    );

    this.state = {
      lastUpdate: null,
      data: null,
      status: "INIT"
    };

    this.platform.logger.debug('Registry', 'Initialized');
  }

  toCelsius(value) {

    if (value === null || value === undefined) {
      return null;
    }

    if (this.inputTemperatureUnit === "C") {
      return value;
    }

    return (value - 32) * (5 / 9);
  }

  resolveExternal(candidates) {

    if (!Array.isArray(candidates)) {
      return null;
    }

    const iss = candidates.find(x => x.type === 1);
    if (iss) {
      return {
        source: "ISS",
        temp: iss.temp,
        humidity: iss.humidity
      };
    }

    const airlink = candidates.find(x => x.type === 6);
    if (airlink) {
      return {
        source: "AIRLINK",
        temp: airlink.temp,
        humidity: airlink.humidity
      };
    }

    return null;
  }

  update(parsed) {

    if (!parsed) {
      this.platform.logger.debug('Registry', 'Update skipped (no parsed data)');
      return;
    }

    this.platform.logger.debug('Registry', 'Update received');

    const now = Date.now();
    const previousStatus = this.state.status;

    const external = this.resolveExternal(parsed.externalCandidates);

    // ✅ NEW: external source INFO log
    this.platform.logger.info(
      "Registry",
      "External source selected: %s",
      external?.source ?? "NONE"
    );

    this.platform.logger.debug('Registry', 'Normalizing data to Celsius');

    const normalized = {
      temperature: this.toCelsius(external?.temp ?? null),
      humidity: external?.humidity ?? null,

      internalTemperature: this.toCelsius(parsed.internalTemperature),
      internalHumidity: parsed.internalHumidity,

      airQuality: parsed.airQuality
    };

    this.state.data = normalized;
    this.state.lastUpdate = now;
    this.state.status = "OK";

    this.platform.logger.debug(
      'Registry',
      'State committed (previous status: %s → %s)',
      previousStatus,
      this.state.status
    );

    this.platform.logger.verbose(
      'Registry',
      'Normalized state: %j',
      normalized
    );
  }

  getState() {

    this.platform.logger.debug('Registry', 'State requested');

    if (!this.state.lastUpdate) {
      this.platform.logger.debug('Registry', 'No data available');
      return { status: "NO_DATA", data: null };
    }

    const ageSeconds = (Date.now() - this.state.lastUpdate) / 1000;

    this.platform.logger.debug('Registry', 'State age: %d seconds', ageSeconds);

    if (ageSeconds > this.staleAfterSeconds) {

      this.platform.logger.debug('Registry', 'State is STALE');

      return {
        status: "STALE",
        ageSeconds,
        data: this.state.data
      };
    }

    this.platform.logger.debug('Registry', 'State is OK');

    return {
      status: "OK",
      ageSeconds,
      data: this.state.data
    };
  }
}

module.exports = Registry;
