import { create } from 'zustand';
import { useLibraryStore } from './libraryStore';
import type { Track } from '@/types/music';

interface PlayerStoreState {
  currentTrack: Track | null;
  queue: Track[];
  queueIndex: number;
  positionMs: number;
  durationMs: number;
  isPlaying: boolean;
  audioQuality: 'AUTO' | 'HIGH' | 'LOW';
  dominantColor: string | null;

  setCurrentTrack: (track: Track | null) => void;
  setQueue: (queue: Track[], index?: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  setPositionMs: (pos: number) => void;
  setDurationMs: (dur: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setAudioQuality: (quality: 'AUTO' | 'HIGH' | 'LOW') => void;
  setDominantColor: (color: string | null) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
}

export const usePlayerStore = create<PlayerStoreState>((set, get) => ({
  currentTrack: null,
  queue: [],
  queueIndex: 0,
  positionMs: 0,
  durationMs: 0,
  isPlaying: false,
  audioQuality: 'HIGH', // Default to high as requested
  dominantColor: null,

  setCurrentTrack: (track) => {
    set({ currentTrack: track });
    if (track) {
      useLibraryStore.getState().addRecentTrack(track);
    }
  },
  
  setQueue: (queue, index = 0) => set({ 
    queue, 
    queueIndex: index,
    currentTrack: queue[index] || null 
  }),

  playNext: () => {
    const { queue, queueIndex } = get();
    if (queueIndex < queue.length - 1) {
      set({ 
        queueIndex: queueIndex + 1,
        currentTrack: queue[queueIndex + 1]
      });
    }
  },

  playPrevious: () => {
    const { queue, queueIndex } = get();
    if (queueIndex > 0) {
      set({ 
        queueIndex: queueIndex - 1,
        currentTrack: queue[queueIndex - 1]
      });
    }
  },

  setPositionMs: (pos) => set({ positionMs: pos }),
  setDurationMs: (dur) => set({ durationMs: dur }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setAudioQuality: (quality) => set({ audioQuality: quality }),
  setDominantColor: (color) => set({ dominantColor: color }),

  reorderQueue: (fromIndex, toIndex) => {
    const { queue, queueIndex } = get();
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= queue.length || toIndex >= queue.length) return;

    const newQueue = [...queue];
    const [movedItem] = newQueue.splice(fromIndex, 1);
    newQueue.splice(toIndex, 0, movedItem);

    // Update queueIndex so the currently playing song doesn't jump
    let newQueueIndex = queueIndex;
    if (fromIndex === queueIndex) {
      newQueueIndex = toIndex;
    } else if (fromIndex < queueIndex && toIndex >= queueIndex) {
      newQueueIndex--;
    } else if (fromIndex > queueIndex && toIndex <= queueIndex) {
      newQueueIndex++;
    }

    set({ queue: newQueue, queueIndex: newQueueIndex });
  },
}));
