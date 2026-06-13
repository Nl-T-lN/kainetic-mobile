import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import type { Track } from "@/types/music";

export interface Playlist {
  id: string;
  name: string;
  coverUrl?: string;
  tracks: Track[];
  createdAt: number;
}

interface LibraryState {
  playlists: Playlist[];
  recentTracks: Track[];
  setPlaylists: (playlists: Playlist[]) => void;
  setRecentTracks: (tracks: Track[]) => void;
  addRecentTrack: (track: Track) => void;
  createPlaylist: (name: string, initialTracks?: Track[]) => string;
  deletePlaylist: (id: string) => void;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      playlists: [],
      recentTracks: [],

      setPlaylists: (playlists: Playlist[]) => {
        set({ playlists });
      },

      setRecentTracks: (tracks: Track[]) => {
        set({ recentTracks: tracks });
      },

      addRecentTrack: (track: Track) => {
        set((state) => {
          const filtered = state.recentTracks.filter((t) => t.videoId !== track.videoId);
          const newTracks = [track, ...filtered].slice(0, 50);
          return { recentTracks: newTracks };
        });
        
        // Supabase sync to be implemented via direct client to avoid website load
      },

      createPlaylist: (name: string, initialTracks?: Track[]) => {
        const id = Crypto.randomUUID();
        const newPlaylist: Playlist = {
          id,
          name,
          tracks: initialTracks || [],
          coverUrl: initialTracks && initialTracks.length > 0 ? initialTracks[0].thumbnailUrl : undefined,
          createdAt: Date.now(),
        };
        set({ playlists: [...get().playlists, newPlaylist] });

        return id;
      },

      deletePlaylist: (id: string) => {
        set({ playlists: get().playlists.filter((p) => p.id !== id) });
      },

      addTrackToPlaylist: (playlistId: string, track: Track) => {
        set({
          playlists: get().playlists.map((p) => {
            if (p.id === playlistId) {
              if (p.tracks.some((t) => t.videoId === track.videoId)) return p;
              return {
                ...p,
                tracks: [...p.tracks, track],
                coverUrl: p.coverUrl || track.thumbnailUrl,
              };
            }
            return p;
          }),
        });
      },

      removeTrackFromPlaylist: (playlistId: string, trackId: string) => {
        set({
          playlists: get().playlists.map((p) => {
            if (p.id === playlistId) {
              return {
                ...p,
                tracks: p.tracks.filter((t) => t.videoId !== trackId),
              };
            }
            return p;
          }),
        });
      },
    }),
    {
      name: "kainetic-library-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
