import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, useWindowDimensions, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { usePlayerStore } from '@/store/playerStore';
import { useLibraryStore } from '@/store/libraryStore';
import { AudioService } from '@/services/AudioService';
import { YouTubeHomeService, HomeSection } from '@/services/YouTubeHomeService';
import { YouTubeSearchService } from '@/services/YouTubeSearchService';
import type { Track, SearchResult } from '@/types/music';
import TopBar from '@/components/ui/TopBar';
import TrackCard from '@/components/features/TrackCard';
import TrackListItem from '@/components/features/TrackListItem';

export default function HomeTab() {
  const router = useRouter();
  const setCurrentTrack = usePlayerStore((state) => state.setCurrentTrack);
  const setQueue = usePlayerStore((state) => state.setQueue);
  const addRecentTrack = useLibraryStore((state) => state.addRecentTrack);
  const recentTracks = useLibraryStore((state) => state.recentTracks) || [];
  
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTrackId, setLoadingTrackId] = useState<string | null>(null);

  useEffect(() => {
    async function loadHome() {
      try {
        const [homeSections, searchResults] = await Promise.all([
          YouTubeHomeService.fetchHome(),
          YouTubeSearchService.search('Top Pop Hits 2024', 'song')
        ]);
        
        const recommendationsSection: HomeSection = {
          title: 'Recommendations',
          items: searchResults
        };

        setSections([recommendationsSection, ...homeSections]);
      } catch (err) {
        console.error('Failed to load home', err);
      } finally {
        setLoading(false);
      }
    }
    loadHome();
  }, []);

  const handlePlayTrack = async (item: SearchResult | Track, list: (SearchResult | Track)[]) => {
    try {
      const isSearchResult = 'type' in item;
      const videoId = isSearchResult ? (item as SearchResult).videoId : (item as Track).videoId;

      if (isSearchResult) {
        const searchItem = item as SearchResult;
        if (searchItem.type !== 'song' || !videoId) {
           if (searchItem.type === 'playlist') router.push(`/playlist/${searchItem.id}`);
           else if (searchItem.type === 'album') router.push(`/album/${searchItem.id}`);
           else if (searchItem.type === 'artist') router.push(`/artist/${searchItem.id}`);
           return;
        }
      }
      
      setLoadingTrackId(videoId!);
      
      const mappedQueue: Track[] = list
        .map(t => {
            if ('type' in t) {
                const st = t as SearchResult;
                if (st.type !== 'song' || !st.videoId) return null;
                return {
                    videoId: st.videoId!,
                    title: st.title,
                    artist: st.channelTitle || 'Unknown Artist',
                    thumbnailUrl: st.thumbnailUrl,
                    durationMs: st.durationMs || 0
                };
            }
            return t as Track;
        })
        .filter((t): t is Track => t !== null);
        
      const index = mappedQueue.findIndex(t => t.videoId === videoId);
      const selectedTrack = mappedQueue[index >= 0 ? index : 0];
      
      setQueue(mappedQueue, index >= 0 ? index : 0);
      setCurrentTrack(selectedTrack);
      addRecentTrack(selectedTrack);
      
      await AudioService.playTrack(videoId!);
    } catch (error) {
      console.error("Playback failed:", error);
    } finally {
      setLoadingTrackId(null);
    }
  };

  const { width } = useWindowDimensions();

  const renderSection = (section: HomeSection, index: number) => {
    const isSongSection = section.items[0]?.type === 'song';
    const isArtistSection = section.items[0]?.type === 'artist' || section.title.toLowerCase().includes('artist');

    if (isSongSection) {
      const chunkSize = 4;
      const chunks = [];
      for (let i = 0; i < section.items.length; i += chunkSize) {
        chunks.push(section.items.slice(i, i + chunkSize));
      }

      return (
        <View key={index} style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>{section.title}</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {chunks.map((chunk, chunkIdx) => (
              <View key={`chunk-${chunkIdx}`} style={{ flexDirection: 'column', gap: 10, marginRight: 16 }}>
                {chunk.map((item, i) => (
                  <View key={item.videoId || item.id || i} style={{ width: width * 0.85, maxWidth: 400, backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)' }}>
                    <TrackListItem
                      track={{
                          videoId: item.videoId || item.id || '',
                          title: item.title,
                          artist: item.channelTitle || 'Unknown Artist',
                          thumbnailUrl: item.thumbnailUrl,
                          durationMs: item.durationMs || 0,
                      }}
                      isLoading={loadingTrackId === item.videoId}
                      onPress={() => handlePlayTrack(item, section.items)}
                    />
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      );
    }

    return (
      <View key={index} style={styles.sectionContainer}>
        <Text style={styles.sectionHeader}>{section.title}</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {section.items.map((item, i) => (
            <View key={item.videoId || item.id || i} style={isArtistSection ? styles.artistWrapper : null}>
              <TrackCard
                track={{
                    videoId: item.videoId || item.id || '',
                    title: item.title,
                    artist: item.channelTitle || 'Unknown Artist',
                    thumbnailUrl: item.thumbnailUrl,
                    durationMs: item.durationMs || 0,
                }}
                isLoading={loadingTrackId === item.videoId}
                onPress={() => handlePlayTrack(item, section.items)}
                isArtist={isArtistSection}
              />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TopBar />
      <ScrollView contentContainerStyle={styles.content}>
        
        {recentTracks.length > 0 && (
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionHeader}>Jam Again</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalScroll}
                >
                  {recentTracks.slice(0, 10).map((track, index) => (
                    <TrackCard
                      key={track.videoId + '-recent'}
                      track={track}
                      isLoading={loadingTrackId === track.videoId}
                      onPress={() => handlePlayTrack(track, recentTracks)}
                    />
                  ))}
                </ScrollView>
            </View>
        )}

        {loading ? (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#1db954" />
            </View>
        ) : (
            sections.map((section, index) => renderSection(section, index))
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    paddingTop: 20,
    paddingBottom: 160, 
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    marginLeft: 16,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  horizontalScroll: {
    gap: 16,
    paddingLeft: 16,
    paddingRight: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  artistWrapper: {
    width: 110,
    alignItems: 'center',
  }
});
