# Simple AWS Lambda Extension

This repo is an example for how to create a AWS lambda extension that leverages the Extensions API and the Telemetry API.

## Usage

### Deployment

In order to deploy the example, you need to run the following command:

```
$ yarn deploy
```

### Invocation

After successful deployment, you can invoke the deployed function by using the following command:

```bash
yarn sls invoke --function testFunction
```

Which should result in response similar to the following:

```json
{
    "statusCode": 200,
    "body": "{\n  \"message\": \"Handler has complete :)\"\n}"
}
```
