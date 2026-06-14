const { Innertube, UniversalCache, ClientType } = require('youtubei.js');

async function run() {
  try {
    const yt = await Innertube.create({
      cache: new UniversalCache(false),
      generate_session_locally: true,
      client_type: ClientType.ANDROID
    });

    console.log("Fetching stream...");
    const info = await yt.getBasicInfo('J7p4bzqLvCw');
    console.log("Status:", info.playability_status.status);
    
    if (info.playability_status.status === 'OK') {
      const format = info.chooseFormat({ type: 'audio', quality: 'best' });
      console.log("Format URL:", format.decipher(yt.session.player));
    } else {
      console.log("Reason:", info.playability_status.reason);
    }
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
