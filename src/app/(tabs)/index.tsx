import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, useWindowDimensions, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { usePlayerStore } from '@/store/playerStore';
import { useLibraryStore } from '@/store/libraryStore';
import { YouTubeHomeService, HomeSection } from '@/services/YouTubeHomeService';
import { YouTubeSearchService } from '@/services/YouTubeSearchService';
import type { Track, SearchResult } from '@/types/music';
import TopBar from '@/components/ui/TopBar';
import { PlaylistCard } from '@/components/features/PlaylistCard';
import { ArtistCard } from '@/components/features/ArtistCard';
import { RecommendedTrackCard } from '@/components/features/RecommendedTrackCard';
import { RefreshCw } from 'lucide-react-native';

export default function HomeTab() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const setCurrentTrack = usePlayerStore((state) => state.setCurrentTrack);
  const setQueue = usePlayerStore((state) => state.setQueue);
  const addRecentTrack = useLibraryStore((state) => state.addRecentTrack);
  const recentTracks = useLibraryStore((state) => state.recentTracks) || [];
  
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHome() {
      try {
        const homeSections = await YouTubeHomeService.fetchHome();
        
        // Generate proper Quick Picks
        let quickPicksTracks = [];
        const recentTracks = useLibraryStore.getState().recentTracks || [];
        if (recentTracks.length > 0 && recentTracks[0].videoId) {
           quickPicksTracks = await YouTubeSearchService.getUpNext(recentTracks[0].videoId);
        } else {
           // Fallback to "Blinding Lights" Up Next for a great generic mix
           quickPicksTracks = await YouTubeSearchService.getUpNext('fHI8X4OXluQ');
        }

        const filteredSections = homeSections.filter(s => 
          !s.title.toLowerCase().includes('quick picks') && 
          !s.title.toLowerCase().includes('recommend')
        );

        const newSections: HomeSection[] = [];
        if (quickPicksTracks && quickPicksTracks.length > 0) {
          newSections.push({
            title: "Quick Picks",
            items: quickPicksTracks.slice(0, 20).map(t => ({
              ...t,
              id: t.videoId,
              type: 'song'
            })) as any
          });
        }

        setSections([...newSections, ...filteredSections]);
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
    } catch (error) {
      console.error("Playback failed:", error);
    }
  };

  const renderSectionHeader = (title: string, showRefresh: boolean = false) => {
    const isQuickPicks = title.toLowerCase().includes('quick picks') || title.toLowerCase().includes('recommendation');
    return (
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>{title}</Text>
        {isQuickPicks ? (
          <TouchableOpacity style={styles.playAllButton}>
            <Text style={styles.playAllText}>Play all</Text>
          </TouchableOpacity>
        ) : showRefresh ? (
          <TouchableOpacity style={styles.iconButton}>
            <RefreshCw size={16} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  const renderSection = (section: HomeSection, index: number) => {
    const isSongSection = section.items[0]?.type === 'song';
    const isArtistSection = section.items[0]?.type === 'artist' || section.title.toLowerCase().includes('artist');

    if (isSongSection) {
      // Chunk items into columns of 4 for RecommendedTracks
      const chunkSize = 4;
      const chunks = [];
      for (let i = 0; i < section.items.length; i += chunkSize) {
        chunks.push(section.items.slice(i, i + chunkSize));
      }

      const columnWidth = width * 0.88;

      return (
        <View key={index} style={styles.sectionContainer}>
          {renderSectionHeader(section.title, true)}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
            snapToInterval={columnWidth + 16} // card width + margin right
            decelerationRate="fast"
            snapToAlignment="start"
          >
            {chunks.map((chunk, chunkIdx) => (
              <View key={`chunk-${chunkIdx}`} style={{ flexDirection: 'column' }}>
                {chunk.map((item, i) => (
                  <RecommendedTrackCard
                    key={item.videoId || item.id || i}
                    width={columnWidth}
                    track={{
                        videoId: item.videoId || item.id || '',
                        title: item.title,
                        artist: item.channelTitle || 'Unknown Artist',
                        thumbnailUrl: item.thumbnailUrl,
                        durationMs: item.durationMs || 0,
                    }}
                    onPress={() => handlePlayTrack(item, section.items)}
                  />
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      );
    }

    if (isArtistSection) {
      return (
        <View key={index} style={styles.sectionContainer}>
          {renderSectionHeader(section.title, true)}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {section.items.map((item, i) => (
              <ArtistCard
                key={item.id || i}
                id={item.id}
                name={item.channelTitle || item.title || "Artist"}
                thumbnailUrl={item.thumbnailUrl}
                onPress={() => item.id && router.push(`/artist/${item.id}`)}
              />
            ))}
          </ScrollView>
        </View>
      );
    }

    // Default Grid (Playlist/Album)
    return (
      <View key={index} style={styles.sectionContainer}>
        {renderSectionHeader(section.title, true)}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {section.items.map((item, i) => (
            <PlaylistCard
              key={item.id || i}
              id={item.id}
              title={item.title}
              subtitle={item.channelTitle}
              thumbnailUrl={item.thumbnailUrl}
              onPress={() => handlePlayTrack(item, section.items)}
            />
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
                {renderSectionHeader("Jam Again")}
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalScroll}
                >
                  {recentTracks.slice(0, 10).map((track, index) => (
                    <PlaylistCard
                      key={track.videoId + '-recent'}
                      title={track.title}
                      subtitle={track.artist}
                      thumbnailUrl={track.thumbnailUrl}
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
    marginBottom: 32,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  playAllText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  horizontalScroll: {
    paddingLeft: 16,
    paddingRight: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  }
});
