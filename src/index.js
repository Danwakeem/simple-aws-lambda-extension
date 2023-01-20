const handler = async (event) => {
  console.log('Hello from my lambda handler 👋');
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Handler has complete :)',
    }),
  };
};

module.exports = { handler };
