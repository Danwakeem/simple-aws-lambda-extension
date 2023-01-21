const http = require('http');
const { EventEmitter } = require('node:events');

const TelemetryAPIService = ({
  extensionIdentifier
}) => {
  const baseUrl = `http://${process.env.AWS_LAMBDA_RUNTIME_API}/2022-07-01/telemetry`;
  const keepAliveAgent = new http.Agent({ keepAlive: true });
  const sandboxHostname = 'sandbox';
  const telemetryEventEmitter = new EventEmitter();
  const completeEvent = 'telemetry-complete';
  let server;

  const startServer = () => {
    server = http
      .createServer((request, response) => {
        if (request.method !== 'POST') throw new Error('Unexpected request method');

        let body = '';
        request.on('data', (data) => {
          body += data;
        });
        request.on('end', () => {
          response.writeHead(200, {});
          response.end('OK');
          const data = JSON.parse(body);
          console.log(JSON.stringify(data));

          for (const event of data) {
            if (event.type === 'platform.runtimeDone') {
              telemetryEventEmitter.emit(completeEvent);
              break;
            }
          }
        });
      })
      .listen(4243, sandboxHostname)
  }

  const registerTelemetry = () => new Promise((resolve, reject) => {
    const eventTypes = ['platform', 'function'];
    const putData = JSON.stringify({
      destination: { protocol: 'HTTP', URI: `http://${sandboxHostname}:4243` },
      types: eventTypes,
      buffering: { timeoutMs: 25, maxBytes: 262144, maxItems: 1000 },
      schemaVersion: '2022-07-01',
    });
    const request = http.request(
      baseUrl,
      {
        agent: keepAliveAgent,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Lambda-Extension-Identifier': extensionIdentifier,
          'Content-Length': Buffer.byteLength(putData),
        },
      },
      (response) => {
        if (response.statusCode === 200) {
          resolve();
        } else {
          reject(
            new Error(`Unexpected logs subscribe response status code: ${response.statusCode}`)
          );
        }
      }
    );
    request.on('error', reject);
    request.write(putData);
    request.end();
  });

  const waitForPlatformDoneEvent = async () => new Promise((resolve) => {
    telemetryEventEmitter.on(completeEvent, resolve);
  })

  return {
    server,
    registerTelemetry,
    startServer,
    waitForPlatformDoneEvent,
  };
};

module.exports = TelemetryAPIService;
