import KaineticExtractor from 'kainetic-extractor';

interface StreamResult {
  url: string;
  mimeType: string;
  bitrate: number;
  userAgent: string;
}

/**
 * InnerTubeService - Native Extraction Bridge (Phase 8)
 * 
 * We have moved the complex decryption logic to a Native Kotlin Module
 * that wraps the NewPipeExtractor library. This provides 100% parity
 * with Kotlin apps like RiMusic.
 */

export class InnerTubeService {
  // Use the same agent we set in the Kotlin Downloader
  private static readonly AGENT = "com.google.android.youtube/19.29.1 (Linux; U; Android 11) gzip";

  static async getAudioStreamUrl(
    videoId: string,
    quality: 'AUTO' | 'HIGH' | 'LOW' = 'HIGH'
  ): Promise<StreamResult> {
    
    // Safety check for UI testing
    if (videoId === 'TEST') {
      return {
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        mimeType: 'audio/mpeg',
        bitrate: 128000,
        userAgent: this.AGENT
      };
    }

    try {
      console.log(`[InnerTube] Calling Native Extractor for ${videoId}...`);

      // One call to Kotlin. Decryption, n-parameter, and signatures 
      // are handled natively by NewPipeExtractor.
      const result = await KaineticExtractor.getAudioStreamUrl(videoId);
      
      console.log(`[InnerTube] Native ✓ Success (bitrate: ${result.bitrate})`);

      return {
        url: result.url,
        mimeType: result.mimeType,
        bitrate: result.bitrate,
        userAgent: this.AGENT
      };

    } catch (e: any) {
      console.error('[InnerTube] Native Extraction failed:', e.message || e);
      throw e;
    }
  }
}
