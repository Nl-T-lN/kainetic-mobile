

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
    name: 'WEB_REMIX',
    payload: { clientName: 'WEB_REMIX', clientVersion: '1.20231214.00.00', osName: 'Android', osVersion: '13', hl: 'en', gl: 'US' },
  },
  {
    name: 'ANDROID_VR', // Excellent non-cipher client for Android
    payload: { clientName: 'ANDROID_VR', clientVersion: '1.56.24', osName: 'Android', osVersion: '13', hl: 'en', gl: 'US' },
  },
  {
    name: 'TVHTML5', // Bypasses many restrictions, natively returns direct URLs
    payload: { clientName: 'TVHTML5', clientVersion: '7.20230405.08.01', hl: 'en', gl: 'US' },
  }
];

export class InnerTubeService {
  /**
   * Fetches the player response using a robust fallback loop.
   * If a client fails, returns ciphered URLs, or denies playback, it instantly tries the next client.
   */
  static async getPlayerResponse(videoId: string): Promise<InnerTubeResponse> {
    for (const client of FALLBACK_CLIENTS) {
      try {
        console.log(`[InnerTube] Trying ${client.name} for ${videoId}...`);
        
        const response = await fetch(INNERTUBE_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Mobile Safari/537.36',
            'X-YouTube-Client-Name': client.name === 'WEB_REMIX' ? '67' : '1',
            'X-YouTube-Client-Version': client.payload.clientVersion,
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
        return data;
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

    // Sort by Opus > MP4A (Android-only optimization)
    formats.sort((a, b) => {
      const aIsOpus = a.mimeType.includes('opus');
      const bIsOpus = b.mimeType.includes('opus');
      if (aIsOpus && !bIsOpus) return -1;
      if (!aIsOpus && bIsOpus) return 1;
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
