import React, { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { usePlayerStore } from '@/store/playerStore';
import { YouTubeBrowseService, BrowseResult } from '@/services/YouTubeBrowseService';
import CollectionDetailView from '@/components/features/CollectionDetailView';
import type { Track } from '@/types/music';

export default function AlbumView() {
  const { id } = useLocalSearchParams();
  const [data, setData] = useState<BrowseResult | null>(null);
  const [loading, setLoading] = useState(true);

  const setCurrentTrack = usePlayerStore((state) => state.setCurrentTrack);
  const setQueue = usePlayerStore((state) => state.setQueue);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
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
  }, [id]);

  const handlePlayTrack = (track: Track, index: number) => {
    if (!data) return;
    setQueue(data.tracks, index);
    setCurrentTrack(track);
  };

  return (
    <CollectionDetailView 
      data={data}
      loading={loading}
      type="Album"
      onPlayTrack={handlePlayTrack}
    />
  );
}
