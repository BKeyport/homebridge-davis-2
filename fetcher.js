class Fetcher {

  constructor(platform) {

    this.platform = platform;
    this.log = platform.log;

    this.platform.logger.debug('Fetcher', 'Initialized');

    this.url = platform.url;
    this.interval = platform.pollingIntervalSeconds * 1000;

    this.timer = null;
    this.failureCount = 0;
  }

  start() {

    this.platform.logger.debug('Fetcher', 'Starting polling (5s delay)');

    setTimeout(() => {

      this._runCycle();

      this.timer = setInterval(() => {
        this._runCycle();
      }, this.interval);

    }, 5000);
  }

  async _runCycle() {

    this.platform.logger.debug('Fetcher', 'Fetch cycle started');

    try {

      const res = await fetch(this.url);

      this.platform.logger.debug('Fetcher', 'HTTP response received');

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      const data = await res.json();

      this.platform.logger.debug('Fetcher', 'JSON parsed successfully');

      this.platform.logger.verbose(
        'Fetcher',
        'Raw weather station payload: %j',
        data
      );

      this.failureCount = 0;

      this.platform.logger.debug('Fetcher', 'Passing data to platform');

      // ✅ NEW: success signal
      this.platform.logger.success(
        'Fetcher',
        'Fetch OK (Davis data received)'
      );

      this.platform.onFetchSuccess(data);

    } catch (err) {

      this.failureCount++;

      const cause = err?.cause;
      const isEscalated = this.failureCount > 4;
      const logLevel = isEscalated ? 'error' : 'warn';

      this.platform.logger[logLevel](
        'Fetcher',
        'Fetch failed (count=%d) - Davis devices are underpowered. Should not happen often. If ERROR, check your config.',
        this.failureCount,
      );

      if (cause) {
        this.platform.logger.debug(
          'Fetcher',
          'Fetch failure cause: %j',
          cause
        );
      }

      if (this.platform.isVerbose?.()) {
        this.platform.logger.debug(
          'Fetcher',
          'Fetch stack trace: %s',
          err.stack
        );
      }

      if (this.failureCount === 6) {
        this.platform.logger.error(
          'Fetcher',
          'Fetcher now in ERROR state',
          this.failureCount
        );
      }
    }
  }
}

module.exports = Fetcher;
