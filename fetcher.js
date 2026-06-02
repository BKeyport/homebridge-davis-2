
class Fetcher {

  constructor(platform) {

    this.platform = platform;
    this.log = platform.log;

    this.url = platform.url;
    this.interval = platform.pollingIntervalSeconds * 1000;

    this.timer = null;
    this.failureCount = 0;

    this.log.info("Fetcher initialized (raw mode enabled)");
  }

  start() {

    setTimeout(() => {

      this.log.debug("Fetcher first cycle starting (startup delay complete)");

      this._runCycle();

      this.timer = setInterval(() => {
        this._runCycle();
      }, this.interval);

    }, 5000);
  }

  async _runCycle() {

    try {

      const res = await fetch(this.url);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      let data;

      try {
        data = await res.json();
      } catch (jsonErr) {
        throw new Error(`Invalid JSON response: ${jsonErr.message}`);
      }

      this.failureCount = 0;

      if (this.platform.isVerbose()) {
        this.log.debug("RAW FETCHED DATA:");
        this.log.debug(JSON.stringify(data, null, 2));
      }

      this.log.debug("Fetch successful");

      this.platform.onFetchSuccess(data);

    } catch (err) {

      this.failureCount++;

      this.log.warn("Fetch failed");
      this.log.warn(`→ URL: ${this.url}`);
      this.log.warn(`→ Error: ${err.message}`);
      this.log.warn(`→ Fail count: ${this.failureCount}`);
    }
  }
}

module.exports = Fetcher;
