const https = require('https');
const url = require('url');

exports.handler = async (event) => {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) {
    console.log('No Slack webhook URL configured');
    return;
  }

  const message = {
    text: `🚨 Pipeline Failure: ${JSON.stringify(event.detail, null, 2)}`
  };
  
  const data = JSON.stringify(message);
  const parsedUrl = url.parse(webhook);
  
  const options = {
    hostname: parsedUrl.hostname,
    path: parsedUrl.path,
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('Slack notification sent successfully');
          resolve({ statusCode: 200 });
        } else {
          console.log(`Slack API error: ${res.statusCode} - ${responseData}`);
          reject(new Error(`Slack API error: ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('Request error:', error);
      reject(error);
    });
    
    req.write(data);
    req.end();
  });
};