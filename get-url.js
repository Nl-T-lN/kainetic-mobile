const https = require('https');

// Create a minimal fetch to Innertube to get the URL
const payload = {
  "context": {
    "client": {
      "clientName": "IOS",
      "clientVersion": "19.29.1",
      "osName": "iOS",
      "osVersion": "17.5.1"
    }
  },
  "videoId": "J7p4bzqLvCw"
};

const req = https.request('https://youtubei.googleapis.com/youtubei/v1/player', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      const formats = json.streamingData.adaptiveFormats.filter(f => f.mimeType.includes('audio'));
      console.log(formats[0].url);
    } catch(e) {
      console.log("Error parsing:", e);
    }
  });
});

req.write(JSON.stringify(payload));
req.end();
