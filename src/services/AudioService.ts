import TrackPlayer, { Capability, Event, State, AppKilledPlaybackBehavior } from 'react-native-track-player';
import { usePlayerStore } from '@/store/playerStore';
import { InnerTubeService } from './InnerTubeService';
import { ablySync } from './AblyService';

export class AudioService {
  private static unsubscribeStore: (() => void) | null = null;
  private static progressInterval: ReturnType<typeof setInterval> | null = null;
  private static isSetup = false;

  static async init() {
    if (this.isSetup) return;
    try {
      await TrackPlayer.setupPlayer({ autoHandleInterruptions: true });
      await TrackPlayer.updateOptions({
        android: {
          appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification
        },
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
          Capability.SeekTo,
        ],
        notificationCapabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
        ],
      });
      
      this.isSetup = true;
      console.log('[AudioService] TrackPlayer configured successfully');

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

      TrackPlayer.addEventListener(Event.PlaybackState, async (event: any) => {
        if (event.state === State.Playing) {
          usePlayerStore.getState().setIsPlaying(true);
          this.startProgressTracker();
        } else if (event.state === State.Paused || event.state === State.Stopped) {
          usePlayerStore.getState().setIsPlaying(false);
          this.stopProgressTracker();
        }
        
        if (event.state === State.Ended) {
            usePlayerStore.getState().playNext();
        }
      });

    } catch (e) {
      console.error('[AudioService] Failed to init TrackPlayer:', e);
    }
  }

  private static startProgressTracker() {
    if (this.progressInterval) clearInterval(this.progressInterval);
    this.progressInterval = setInterval(async () => {
      const progress = await TrackPlayer.getProgress();
      usePlayerStore.getState().setPositionMs(progress.position * 1000);
      usePlayerStore.getState().setDurationMs(progress.duration * 1000);
    }, 1000);
  }

  private static stopProgressTracker() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  static async playTrack(videoId: string) {
    try {
      const state = usePlayerStore.getState();
      const currentTrack = state.currentTrack;
      const quality = state.audioQuality;

      console.log(`[AudioService] Requesting extraction for ${videoId}...`);
      
      // Ensure native engine is warm
      await new Promise(resolve => setTimeout(resolve, 500));

      const result = await InnerTubeService.getAudioStreamUrl(videoId, quality);
      
      if (!result || !result.url) {
        throw new Error('Extractor returned empty URL');
      }

      console.log(`[AudioService] Success! Received URL: ${result.url.substring(0, 50)}...`);

      // Race condition safety: Did the user skip tracks while we were extracting?
      if (usePlayerStore.getState().currentTrack?.videoId !== videoId) {
        console.log(`[AudioService] Aborting playback for ${videoId}, track was skipped during extraction.`);
        return;
      }

      await TrackPlayer.reset();
      await TrackPlayer.add({
        id: videoId,
        url: result.url,
        title: currentTrack?.title || 'Unknown Title',
        artist: currentTrack?.artist || 'Unknown Artist',
        artwork: currentTrack?.thumbnailUrl,
        userAgent: result.userAgent
      });
      
      await TrackPlayer.play();
      
      ablySync.broadcastState();

    } catch (error: any) {
      console.error('[AudioService] Playback Error:', error.message || error);
      usePlayerStore.getState().setIsPlaying(false);
    }
  }

  static async pause() {
    await TrackPlayer.pause();
  }

  static async resume() {
    await TrackPlayer.play();
  }

  static async seekTo(ms: number) {
    await TrackPlayer.seekTo(ms / 1000);
  }
}
