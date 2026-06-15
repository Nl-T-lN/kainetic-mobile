import { createAudioPlayer, AudioPlayer, setAudioModeAsync } from 'expo-audio';
import { usePlayerStore } from '@/store/playerStore';
import { InnerTubeService } from './InnerTubeService';
import { ablySync } from './AblyService';

export class AudioService {
  private static player: AudioPlayer | null = null;
  private static unsubscribeStore: (() => void) | null = null;

  static async init() {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        interruptionMode: 'duckOthers',
        shouldPlayInBackground: true,
        allowsRecording: false,
      });
      console.log('[AudioService] Audio mode configured successfully');

      // Unsubscribe previous if exists
      if (this.unsubscribeStore) {
        this.unsubscribeStore();
      }

      // Subscribe to Zustand store changes purely outside of React
      this.unsubscribeStore = usePlayerStore.subscribe((state, prevState) => {
        if (state.currentTrack?.videoId !== prevState.currentTrack?.videoId) {
          if (state.currentTrack) {
            this.playTrack(state.currentTrack.videoId);
          } else {
            this.pause();
          }
        }
      });

    } catch (e) {
      console.error('[AudioService] Failed to set audio mode:', e);
    }
  }

  static async playTrack(videoId: string) {
    try {
      if (this.player) {
        try {
          this.player.pause();
          this.player.remove();
        } catch (e) {}
        this.player = null;
      }

      const quality = usePlayerStore.getState().audioQuality;

      console.log(`[AudioService] Requesting extraction for ${videoId}...`);
      
      // Ensure native engine is warm
      await new Promise(resolve => setTimeout(resolve, 500));

      const result = await InnerTubeService.getAudioStreamUrl(videoId, quality);
      
      if (!result || !result.url) {
        throw new Error('Extractor returned empty URL');
      }

      console.log(`[AudioService] Success! Received URL: ${result.url.substring(0, 50)}...`);

      this.player = createAudioPlayer({ 
        uri: result.url,
        headers: {
          'User-Agent': result.userAgent
        }
      });
      
      this.player.volume = 1.0;
      this.player.play();
      
      usePlayerStore.getState().setIsPlaying(true);
      ablySync.broadcastState();

      this.player.addListener('playbackStatusUpdate', (status) => {
        if (!this.player) return;
        const currentTime = this.player.currentTime || 0;
        const duration = this.player.duration || 0;
        const isPlaying = this.player.playing || false;

        usePlayerStore.getState().setPositionMs(currentTime * 1000);
        usePlayerStore.getState().setDurationMs(duration * 1000);

        if (usePlayerStore.getState().isPlaying !== isPlaying) {
          usePlayerStore.getState().setIsPlaying(isPlaying);
        }

        if (currentTime >= duration && duration > 0 && isPlaying) {
          usePlayerStore.getState().playNext();
        }
      });

    } catch (error: any) {
      console.error('[AudioService] Playback Error:', error.message || error);
      usePlayerStore.getState().setIsPlaying(false);
    }
  }

  static async pause() {
    if (this.player) {
      this.player.pause();
      usePlayerStore.getState().setIsPlaying(false);
    }
  }

  static async resume() {
    if (this.player) {
      this.player.play();
      usePlayerStore.getState().setIsPlaying(true);
    }
  }
}
