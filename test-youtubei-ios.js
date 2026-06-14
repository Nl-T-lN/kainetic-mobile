const { Innertube, UniversalCache, ClientType } = require('youtubei.js');

async function run() {
  try {
    const yt = await Innertube.create({
      cache: new UniversalCache(false),
      generate_session_locally: true,
      client_type: ClientType.IOS
    });

    console.log("Fetching stream...");
    const info = await yt.getBasicInfo('J7p4bzqLvCw', 'IOS');
    console.log("Status:", info.playability_status.status);
    
    if (info.playability_status.status === 'OK') {
      const format = info.chooseFormat({ type: 'audio', quality: 'best' });
      const url = await format.decipher(yt.session.player);
      console.log("Format URL:", url.substring(0, 100) + "...");
    } else {
      console.log("Reason:", info.playability_status.reason);
    }
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
