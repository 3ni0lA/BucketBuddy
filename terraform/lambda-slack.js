// index.js
const https = require('https');
exports.handler = async (event) => {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  const message = {
    text: `🚨 CodePipeline Failure: ${JSON.stringify(event.detail, null, 2)}`
  };
  const data = JSON.stringify(message);
  const options = {
    hostname: 'hooks.slack.com',
    path: webhook.split('hooks.slack.com')[1],
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  };
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      res.on('data', () => {});
      res.on('end', resolve);
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
};