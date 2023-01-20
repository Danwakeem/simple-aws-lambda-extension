#!/usr/bin/env node
// The #!/usr/bin/env node is important so that the lambda function knows we are trying to
// run our extension using nodejs.

const { EventTypes, ...extensionAPIService} = require('./api/extensions')();
const logger = require('./util/logger');

// We use a self invoking function so that our extension code will boot up on lambda start
(async function main () {
  
  // Register extension code against via the Extensions API
  logger.log('Extension is booting up...');
  const extensionIdentifier = await extensionAPIService.register();

  // extensionIdentifier is how lambda knows which
  // extension is sending each event
  logger.log('Extension Id received: ', extensionIdentifier);

  while(true) {
    /**
     * We call the next event twice on each lambda invocation.
     * The first call lets lambda know that the extension is ready to begin.
     * The second call lets lambda know that our extension has finished running.
     * 
     * Keep in mind the lambda function freezes execution immediately after the second call to next.
     * This means that when our lambda performs a warm start we will begin execution again starting
     * with a response from extensionAPIService.next and then freezing again after we make this call again
     * on the next iteration of the while loop.
     */
    logger.log('Extension calling next: ', extensionIdentifier);
    const event = await extensionAPIService.next({
      extensionIdentifier
    });

    // Do whatever work we want the extension to do
    logger.log('Extension doing some work: ', extensionIdentifier);
    await extensionAPIService.doSomeWork();

    // The next call to the `.next` lambda know that my extension is done executing
    logger.log('Extension code complete: ', event.eventType);
  }
})();