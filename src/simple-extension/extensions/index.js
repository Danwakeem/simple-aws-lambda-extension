#!/usr/bin/env node
// The #!/usr/bin/env node is important so that our lambda function
// knows we are trying to run our extension using nodejs.

const { EventTypes, ...extensionAPIService} = require('./api/extensions')();
const TelemetryAPIService = require('./api/telemetry');
const logger = require('./util/logger');

// We use a self invoking function so that our extension code will boot up on lambda start
(async function main () {
  
  // Register extension code against via the Extensions API
  logger.log('Extension is booting up...');
  const extensionIdentifier = await extensionAPIService.register();

  const telemetryAPIService = TelemetryAPIService({
    extensionIdentifier,
  });
  // Start up our telemetry local server
  telemetryAPIService.startServer();
  // Register our telemetry server with the Telemetry API
  telemetryAPIService.registerTelemetry();

  // extensionIdentifier is how lambda knows which extension is sending each event
  logger.log('Extension Id received: ', extensionIdentifier);

  while(true) {
    /**
     * The first call to lets lambda know that the extension is ready to begin.
     * The second call lets lambda know that our extension has finished running.
     * 
     * Keep in mind the lambda function freezes execution immediately after
     * the second call to next.
     *
     * This means that when our lambda performs a warm start we will begin
     * execution again starting with a response from extensionAPIService.next
     * and then freezing again after we make this call again on the next
     * iteration of the while loop.
     */
    logger.log('Extension calling next: ', extensionIdentifier);
    const event = await extensionAPIService.next({
      extensionIdentifier
    });

    // Wait for our telemetry server to receive the platform done event.
    // The platform.runtimeDone event lets us know when our lambda runtime
    // code has completed its execution.
    await telemetryAPIService.waitForPlatformDoneEvent();

    // Do some more work before we let our extension complete execution
    logger.log('Extension doing some work: ', extensionIdentifier);
    await extensionAPIService.doSomeWork();

    // The next call to the `.next` lambda know that my extension is done executing
    logger.log('Extension code complete: ', event.eventType);

    // Once we receive the shutdown event we want to clean up our extension by
    // shutting down our telemetry server.
    if (event.eventType === EventTypes.Shutdown) {
      await telemetryAPIService.shutDownServer();
    }
  }
})();