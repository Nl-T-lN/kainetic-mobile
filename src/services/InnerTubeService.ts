

const INNERTUBE_API = 'https://www.youtube.com/youtubei/v1/player';

export interface InnerTubeFormat {
  itag: number;
  url?: string;
  signatureCipher?: string;
  mimeType: string;
  bitrate: number;
  audioQuality: string;
  contentLength: string;
}

export interface InnerTubeResponse {
  streamingData?: {
    adaptiveFormats: InnerTubeFormat[];
  };
  playabilityStatus?: {
    status: string;
    reason?: string;
  };
}

// Metrolist-inspired robust clients to bypass ciphering and age restrictions
const FALLBACK_CLIENTS = [
  {
    name: 'IOS', // Bypasses cipher completely and returns direct Opus/MP4A streams
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
  },
  {
    name: 'WEB_REMIX',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0',
    clientId: '67',
    payload: { clientName: 'WEB_REMIX', clientVersion: '1.20260213.01.00', hl: 'en', gl: 'US' },
  },
  {
    name: 'ANDROID_VR', // Excellent non-cipher client for Android (Quest 3 spoof)
    userAgent: 'com.google.android.apps.youtube.vr.oculus/1.61.48 (Linux; U; Android 12; en_US; Quest 3; Build/SQ3A.220605.009.A1; Cronet/132.0.6808.3)',
    clientId: '28',
    payload: { 
      clientName: 'ANDROID_VR', 
      clientVersion: '1.61.48', 
      osName: 'Android', 
      osVersion: '12', 
      deviceMake: 'Oculus',
      deviceModel: 'Quest 3',
      androidSdkVersion: '32',
      hl: 'en', 
      gl: 'US' 
    },
  },
  {
    name: 'TVHTML5', // Bypasses many restrictions, natively returns direct URLs
    userAgent: 'Mozilla/5.0(SMART-TV; Linux; Tizen 4.0.0.2) AppleWebkit/605.1.15 (KHTML, like Gecko) SamsungBrowser/9.2 TV Safari/605.1.15',
    clientId: '7',
    payload: { clientName: 'TVHTML5', clientVersion: '7.20260213.00.00', hl: 'en', gl: 'US' },
  }
];

export class InnerTubeService {
  /**
   * Fetches the player response using a robust fallback loop.
   * If a client fails, returns ciphered URLs, or denies playback, it instantly tries the next client.
   */
  static async getPlayerResponse(videoId: string): Promise<{ data: InnerTubeResponse, userAgent: string }> {
    for (const client of FALLBACK_CLIENTS) {
      try {
        console.log(`[InnerTube] Trying ${client.name} for ${videoId}...`);
        
        const response = await fetch(INNERTUBE_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': client.userAgent,
            'X-YouTube-Client-Name': client.clientId,
            'X-YouTube-Client-Version': client.payload.clientVersion,
            'Origin': 'https://music.youtube.com',
            'Referer': 'https://music.youtube.com/'
          },
          body: JSON.stringify({
            context: { client: client.payload },
            videoId: videoId,
          }),
        });

        if (!response.ok) continue;

        const data: InnerTubeResponse = await response.json();

        // If the video is unplayable (e.g. age restricted) or has no adaptive formats, try next client
        if (data.playabilityStatus?.status === 'UNPLAYABLE' || !data.streamingData?.adaptiveFormats) {
          console.warn(`[InnerTube] ${client.name} returned unplayable/empty. Falling back...`);
          continue;
        }

        // If the best formats are ciphered, we want to try a non-cipher client (like ANDROID_VR or TVHTML5)
        const hasDirectUrl = data.streamingData.adaptiveFormats.some(f => f.url && !f.signatureCipher);
        if (!hasDirectUrl) {
          console.warn(`[InnerTube] ${client.name} returned only ciphered streams. Falling back to avoid JS deciphering...`);
          continue;
        }

        console.log(`[InnerTube] Success with ${client.name}!`);
        return { data, userAgent: client.userAgent };
      } catch (e) {
        console.warn(`[InnerTube] ${client.name} request failed.`, e);
      }
    }

    throw new Error('All InnerTube fallback clients failed to extract un-ciphered audio.');
  }

  /**
   * Replicates Metrolist's extraction algorithm.
   * Since this is Android-only, we aggressively prioritize Opus for the best quality/bandwidth ratio.
   */
  static extractBestAudioFormat(
    response: InnerTubeResponse, 
    qualityPreference: 'AUTO' | 'HIGH' | 'LOW' = 'HIGH'
  ): InnerTubeFormat | null {
    if (!response.streamingData?.adaptiveFormats) return null;

    // Filter to audio-only and strictly those with direct URLs (we bypassed ciphering in getPlayerResponse)
    const formats = response.streamingData.adaptiveFormats.filter(f => 
      f.mimeType.startsWith('audio/') && f.url && !f.signatureCipher
    );

    if (formats.length === 0) return null;

    // Sort by MP4A > Opus (Android native media player optimization and iOS compatibility)
    formats.sort((a, b) => {
      const aIsMp4 = a.mimeType.includes('mp4a');
      const bIsMp4 = b.mimeType.includes('mp4a');
      if (aIsMp4 && !bIsMp4) return -1;
      if (!aIsMp4 && bIsMp4) return 1;
      return b.bitrate - a.bitrate; // Tie-breaker: higher bitrate
    });

    if (qualityPreference === 'HIGH') {
      const hqFormat = formats.find(f => f.audioQuality === 'AUDIO_QUALITY_HIGH');
      if (hqFormat) return hqFormat;
    }

    if (qualityPreference === 'LOW') {
      const lqFormat = formats.find(f => f.audioQuality === 'AUDIO_QUALITY_LOW');
      if (lqFormat) return lqFormat;
    }

    return formats[0]; // Returns the best Opus or highest bitrate M4A
  }
}
