import TrackPlayer, { Event } from 'react-native-track-player';
import { usePlayerStore } from '@/store/playerStore';

export const PlaybackService = async function () {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());

  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());

  TrackPlayer.addEventListener(Event.RemoteNext, () => {
    usePlayerStore.getState().playNext();
  });

  TrackPlayer.addEventListener(Event.RemotePrevious, () => {
    usePlayerStore.getState().playPrevious();
  });

  TrackPlayer.addEventListener(Event.RemoteSeek, (event) => {
    if (event.position) {
      TrackPlayer.seekTo(event.position);
    }
  });
};
