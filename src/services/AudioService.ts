import { createAudioPlayer, AudioPlayer } from 'expo-audio';
import { usePlayerStore } from '@/store/playerStore';
import { InnerTubeService } from './InnerTubeService';

export class AudioService {
  private static player: AudioPlayer | null = null;
  private static statusInterval: NodeJS.Timeout | null = null;

  static async init() {
    // expo-audio manages background modes automatically based on app.json config
  }

  static async playTrack(videoId: string) {
    try {
      if (this.player) {
        this.player.pause();
        this.player = null;
      }
      
      if (this.statusInterval) {
        clearInterval(this.statusInterval);
      }

      const quality = usePlayerStore.getState().audioQuality;
      const response = await InnerTubeService.getPlayerResponse(videoId);
      const format = InnerTubeService.extractBestAudioFormat(response, quality);

      if (!format) {
        throw new Error('No compatible audio formats found.');
      }

      let streamUrl = format.url;

      if (!streamUrl && format.signatureCipher) {
        console.warn('Ciphered stream detected. Deciphering required.');
        throw new Error('Cipher deciphering not yet fully implemented in sandbox.');
      }

      if (!streamUrl) throw new Error('Stream URL is missing.');

      console.log(`[AudioService] Playing ${quality} quality stream:`, streamUrl);

      this.player = createAudioPlayer(streamUrl);
      this.player.play();
      usePlayerStore.getState().setIsPlaying(true);

      // Track status manually since expo-audio might require a different callback mechanism
      this.statusInterval = setInterval(() => {
        if (this.player) {
          usePlayerStore.getState().setPositionMs(this.player.currentTime * 1000);
          usePlayerStore.getState().setDurationMs(this.player.duration * 1000);
          usePlayerStore.getState().setIsPlaying(this.player.playing);
          
          if (this.player.currentTime >= this.player.duration && this.player.duration > 0) {
            usePlayerStore.getState().playNext();
          }
        }
      }, 1000);

    } catch (error) {
      console.error('[AudioService] Playback Error:', error);
      usePlayerStore.getState().setIsPlaying(false);
    }
  }

  static async pause() {
    if (this.player) this.player.pause();
  }

  static async resume() {
    if (this.player) this.player.play();
  }
}
