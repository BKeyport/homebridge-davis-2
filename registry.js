
class Registry {

  constructor(platform) {

    this.platform = platform;
    this.log = platform.log;

    this.staleAfterSeconds = platform.staleAfterSeconds;

    this.temperatureUnit = platform.temperatureUnit;

    this.state = {
      lastUpdate: null,
      data: null,
      status: "INIT"
    };

    this.log.info("Registry initialized");
  }

  toCelsius(value) {

    if (value === null || value === undefined) {
      return null;
    }

    // already Celsius
    if (this.temperatureUnit === "C") {
      return value;
    }

    // Fahrenheit → Celsius
    return (value - 32) * (5 / 9);
  }

  update(parsed) {

    if (!parsed) {
      this.log.warn("Registry rejected update (null parsed data)");
      return;
    }

    const now = Date.now();
    const previousStatus = this.state.status;

    // 🔥 NORMALIZATION HAPPENS HERE
    const normalized = {
      temperature: this.toCelsius(parsed.temperature),
      humidity: parsed.humidity,

      internalTemperature: this.toCelsius(parsed.internalTemperature),
      internalHumidity: parsed.internalHumidity,

      airQuality: parsed.airQuality
    };

    this.state.data = normalized;
    this.state.lastUpdate = now;
    this.state.status = "OK";

    this.log.debug(`Registry state transition: ${previousStatus} → OK`);
    this.log.debug("Registry updated (Celsius normalized)");
  }

  getState() {

    if (!this.state.lastUpdate) {
      this.log.debug("Registry evaluated → NO_DATA");
      return { status: "NO_DATA", data: null };
    }

    const ageSeconds = (Date.now() - this.state.lastUpdate) / 1000;

    if (ageSeconds > this.staleAfterSeconds) {

      this.log.debug(`Registry evaluated → STALE (${Math.round(ageSeconds)}s)`);

      return {
        status: "STALE",
        ageSeconds,
        data: this.state.data
      };
    }

    this.log.debug("Registry evaluated → OK");

    return {
      status: "OK",
      ageSeconds,
      data: this.state.data
    };
  }
}

module.exports = Registry;
