const { InnerTubeService } = require('./src/services/InnerTubeService.ts');

async function test() {
  const tsNode = require('ts-node');
  tsNode.register();
  const InnerTube = require('./src/services/InnerTubeService.ts').InnerTubeService;
  
  const res = await InnerTube.getPlayerResponse('J7p4bzqLvCw');
  const format = InnerTube.extractBestAudioFormat(res.data, 'HIGH');
  console.log("Format URL:", format ? format.url : "No URL");

  if (format && format.url) {
    const fetch = require('node-fetch');
    const streamRes = await fetch(format.url, {
      method: 'GET'
    });
    console.log("Stream Status:", streamRes.status);
    console.log("Content-Length:", streamRes.headers.get('content-length'));
    console.log("Content-Type:", streamRes.headers.get('content-type'));
  }
}
test();
