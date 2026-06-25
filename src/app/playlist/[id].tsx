import React, { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { usePlayerStore } from '@/store/playerStore';
import { useLibraryStore } from '@/store/libraryStore';
import { YouTubeBrowseService, BrowseResult } from '@/services/YouTubeBrowseService';
import CollectionDetailView from '@/components/features/CollectionDetailView';
import LocalPlaylistView from '@/components/features/LocalPlaylistView';
import type { Track } from '@/types/music';

export default function PlaylistView() {
  const { id } = useLocalSearchParams();
  const [data, setData] = useState<BrowseResult | null>(null);
  const [loading, setLoading] = useState(true);

  const playlists = useLibraryStore((state) => state.playlists);
  const setCurrentTrack = usePlayerStore((state) => state.setCurrentTrack);
  const setQueue = usePlayerStore((state) => state.setQueue);

  const localPlaylist = playlists.find(p => p.id === id);

  useEffect(() => {
    async function fetchData() {
      if (!id || localPlaylist) {
        if (localPlaylist) setLoading(false);
        return;
      }
      try {
        const res = await YouTubeBrowseService.getAlbumOrPlaylist(id as string);
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, localPlaylist]);

  const handlePlayTrack = (track: Track, index: number) => {
    if (localPlaylist) {
      setQueue(localPlaylist.tracks, index);
      setCurrentTrack(track);
    } else if (data) {
      setQueue(data.tracks, index);
      setCurrentTrack(track);
    }
  };

  if (localPlaylist) {
    return <LocalPlaylistView playlist={localPlaylist} onPlayTrack={handlePlayTrack} />;
  }

  return (
    <CollectionDetailView 
      data={data}
      loading={loading}
      type="Playlist"
      onPlayTrack={handlePlayTrack}
    />
  );
}
