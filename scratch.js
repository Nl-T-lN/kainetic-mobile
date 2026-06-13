const fetch = require('node-fetch');

const INNERTUBE_API = 'https://www.youtube.com/youtubei/v1/player';

const client = {
  name: 'IOS',
  userAgent: 'com.google.ios.youtube/21.03.1 (iPhone16,2; U; CPU iOS 18_2 like Mac OS X;)',
  clientId: '5',
  payload: {
    clientName: 'IOS',
    clientVersion: '21.03.1',
    osName: 'iOS',
    osVersion: '18.2.22C152',
    deviceMake: 'Apple',
    deviceModel: 'iPhone16,2',
    hl: 'en',
    gl: 'US'
  }
};

async function test(videoId) {
  try {
    const res = await fetch(INNERTUBE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': client.userAgent,
        'X-YouTube-Client-Name': client.clientId,
        'X-YouTube-Client-Version': client.payload.clientVersion
      },
      body: JSON.stringify({
        context: { client: client.payload },
        videoId: videoId
      })
    });
    const data = await res.json();
    if (data.streamingData?.adaptiveFormats) {
      const audio = data.streamingData.adaptiveFormats.filter(f => f.mimeType.includes('audio'));
      const url = audio[0].url;
      console.log('Testing URL:', url);
      const urlRes = await fetch(url, { method: 'GET', headers: { 'User-Agent': client.userAgent, 'Range': 'bytes=0-1000' } });
      console.log('Status:', urlRes.status);
      console.log('Headers:', urlRes.headers.raw());
      const size = urlRes.headers.get('content-length');
      console.log('Size:', size);
    }
  } catch (e) { console.error(e); }
}

test('kIft-LUHHVA');
