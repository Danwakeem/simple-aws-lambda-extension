const http = require('http');

const ExtensionAPIService = () => {
  const baseUrl = `http://${process.env.AWS_LAMBDA_RUNTIME_API}/2020-01-01/extension`;
  const keepAliveAgent = new http.Agent({ keepAlive: true });
  let extensionId;
  const EventTypes = {
    Invoke: 'INVOKE',
    Shutdown: 'SHUTDOWN',
  };

  const register = () => new Promise((resolve, reject) => {
    const postData = JSON.stringify({ events: [EventTypes.Invoke, EventTypes.Shutdown] });
    const request = http.request(
      `${baseUrl}/register`,
      {
        agent: keepAliveAgent,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Lambda-Extension-Name': 'index.js',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Unexpected register response status code: ${response.statusCode}`));
          return;
        }

        extensionId = response.headers['lambda-extension-identifier'];
        resolve(extensionId);
      }
    );
    request.on('error', reject);
    request.write(postData);
    request.end();
  });

  const next = ({ extensionIdentifier } = {}) => new Promise((resolve, reject) => {
    const request = http.request(
      `${baseUrl}/event/next`,
      {
        agent: keepAliveAgent,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Lambda-Extension-Identifier': extensionIdentifier || extensionId,
        },
      },
      (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Unexpected register response status code: ${response.statusCode}`));
          return;
        }
        response.setEncoding('utf8');
        let result = '';
        response.on('data', (chunk) => {
          result += String(chunk);
        });
        response.on('end', () => {
          resolve(JSON.parse(result));
        });
      }
    );
    request.on('error', reject);
    request.end();
  });

  const doSomeWork = () => new Promise((resolve) => {
    for(let i = 0; i < 5; i++) {
      setTimeout(() => {
        console.log(`Your extension is hard at work: ${i}`);
        if (i === 4) resolve();
      }, 100 + (i * 50));
    }
  });

  return {
    EventTypes,
    register,
    next,
    doSomeWork,
  };
};

module.exports = ExtensionAPIService;
