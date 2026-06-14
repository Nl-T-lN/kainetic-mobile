import urllib.request
import json

instances = [
    "https://pipedapi.lunar.icu",
    "https://pipedapi.smnz.de",
    "https://piped-api.garudalinux.org",
    "https://api.piped.projectsegfau.lt",
    "https://pipedapi.in.projectsegfau.lt"
]

for inst in instances:
    req = urllib.request.Request(f"{inst}/streams/kIft-LUHHVA")
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode())
            if "audioStreams" in data and len(data["audioStreams"]) > 0:
                print(f"Success with {inst}")
                print(json.dumps(data["audioStreams"][0], indent=2))
                break
    except Exception as e:
        print(f"Failed {inst}: {e}")
