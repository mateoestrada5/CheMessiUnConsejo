// netlify/functions/ping.js

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ 
      message: 'pong', 
      timestamp: new Date().toISOString(),
      status: 'alive'
    })
  };
};