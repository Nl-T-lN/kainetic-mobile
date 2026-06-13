const fetch = require('node-fetch');
const WEB_CLIENT_PAYLOAD = {
  clientName: 'WEB_REMIX',
  clientVersion: '1.20231214.00.00',
  hl: 'en',
  gl: 'US',
};

async function test() {
  const BROWSE_API = 'https://music.youtube.com/youtubei/v1/browse';
  const response = await fetch(BROWSE_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
      'Origin': 'https://music.youtube.com',
      'Referer': 'https://music.youtube.com/',
    },
    body: JSON.stringify({
      context: { client: WEB_CLIENT_PAYLOAD },
      browseId: "FEmusic_home",
    }),
  });
  console.log("Status:", response.status);
  const text = await response.text();
  console.log("Text:", text.substring(0, 100));
}
test();
