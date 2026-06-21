import React, { useState, useEffect, useCallback, memo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, useWindowDimensions, TouchableOpacity, ScrollView, RefreshControl, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlayerStore } from '@/store/playerStore';
import { useLibraryStore } from '@/store/libraryStore';
import { YouTubeHomeService, HomeSection } from '@/services/YouTubeHomeService';
import { YouTubeSearchService } from '@/services/YouTubeSearchService';
import type { Track, SearchResult } from '@/types/music';
import TopBar from '@/components/ui/TopBar';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import { PlaylistCard } from '@/components/features/PlaylistCard';
import { ArtistCard } from '@/components/features/ArtistCard';
import { RecommendedTrackCard } from '@/components/features/RecommendedTrackCard';
import { SpeedDialCard } from '@/components/features/SpeedDialCard';
import { SongGridCard } from '@/components/features/SongGridCard';
import { RefreshCw } from 'lucide-react-native';

// Global cache to prevent rate-limiting on hot reloads
let cachedHomeSections: HomeSection[] | null = null;

const SectionHeader = memo(({ title }: { title: string }) => {
  const isQuickPicks = title.toLowerCase().includes('quick picks') || title.toLowerCase().includes('recommendation');
  return (
    <View style={styles.sectionHeaderRow}>
      <Text style={styles.sectionHeader}>{title}</Text>
      {isQuickPicks && (
        <TouchableOpacity style={styles.playAllButton}>
          <Text style={styles.playAllText}>Play all</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

export default function HomeTab() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const setCurrentTrack = usePlayerStore((state) => state.setCurrentTrack);
  const setQueue = usePlayerStore((state) => state.setQueue);
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const insets = useSafeAreaInsets();
  const lastScrollY = React.useRef(0);
  const translateY = React.useRef(new Animated.Value(0)).current;

  const handleScroll = useCallback((event: any) => {
    const currentY = event.nativeEvent.contentOffset.y;
    const deltaY = currentY - lastScrollY.current;

    if (currentY < 50) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else if (deltaY > 10) {
      Animated.timing(translateY, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else if (deltaY < -15) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }

    lastScrollY.current = currentY;
  }, [translateY]);

  const loadHome = useCallback(async (force = false, isRefreshAction = false) => {
    if (!force && cachedHomeSections && !isRefreshAction) {
      setSections(cachedHomeSections);
      setLoading(false);
      return;
    }

    if (isRefreshAction) {
      setRefreshing(true);
    }

    try {
      const stateRecentTracks = useLibraryStore.getState().recentTracks || [];
      const hasHistory = stateRecentTracks.length > 0;
      
      const similarToSeeds: any[] = [];
      const seenArtists = new Set<string>();
      
      if (hasHistory) {
        for (const track of stateRecentTracks) {
          if (track.videoId === stateRecentTracks[0].videoId) continue;
          const artist = track.artist.split(',')[0].trim();
          if (!seenArtists.has(artist)) {
            seenArtists.add(artist);
            similarToSeeds.push(track);
          }
          if (similarToSeeds.length >= 3) break;
        }
      }

      const promises: Promise<any>[] = [
        YouTubeHomeService.fetchHome()
      ];

      if (hasHistory) {
        promises.push(YouTubeSearchService.getUpNext(stateRecentTracks[0].videoId)); // Quick Picks Seed
        similarToSeeds.forEach(seed => {
          promises.push(YouTubeSearchService.getUpNext(seed.videoId));
        });
      }

      const results = await Promise.all(promises);
      const homeSections = results[0];
      const quickPicksTracks = hasHistory ? results[1] : null;
      const similarToResults = hasHistory ? results.slice(2) : [];

      const filteredSections = homeSections.filter((s: any) => 
        !s.title.toLowerCase().includes('quick picks') && 
        !s.title.toLowerCase().includes('recommend')
      );

      const newSections: HomeSection[] = [];
      
      const speedDialItems: any[] = [];
      const localPlaylists = useLibraryStore.getState().playlists || [];
      localPlaylists.slice(0, 4).forEach((p: any) => {
        speedDialItems.push({
          id: p.id,
          videoId: '',
          title: p.name,
          artist: 'Playlist',
          thumbnailUrl: p.coverUrl || 'https://via.placeholder.com/150',
          type: 'playlist'
        });
      });

      if (hasHistory) {
        stateRecentTracks.slice(0, 15).forEach((t: any) => {
          speedDialItems.push({
            ...t,
            id: t.videoId,
            type: 'song'
          });
        });
      }

      homeSections.forEach((section: any) => {
        section.items.forEach((item: any) => {
           if ((item.type === 'artist' || item.type === 'album' || item.type === 'playlist') && speedDialItems.length < 27) {
             if (!speedDialItems.some(existing => existing.id === item.id)) {
                speedDialItems.push(item);
             }
           }
        });
      });

      if (speedDialItems.length > 0) {
        newSections.push({
          title: "Speed dial",
          items: speedDialItems.sort(() => Math.random() - 0.5).slice(0, 27)
        });
      }

      if (hasHistory) {
        newSections.push({
          title: "Jam Again",
          items: stateRecentTracks.slice(0, 10).map((t: any) => ({
            ...t,
            id: t.videoId,
            type: 'playlist'
          })) as any
        });
      }

      if (quickPicksTracks && quickPicksTracks.length > 0) {
        newSections.push({
          title: "Quick Picks",
          items: quickPicksTracks.slice(0, 20).map((t: any) => ({
            ...t,
            id: t.videoId,
            type: 'song'
          })) as any
        });
      }

      similarToSeeds.forEach((seed, index) => {
        const tracks = similarToResults[index];
        if (tracks && tracks.length > 0) {
          const primaryArtist = seed.artist.split(',')[0].trim();
          
          let shelfTitle = `Similar to ${primaryArtist}`;
          if (index === 1) shelfTitle = `Because you listened to ${seed.title}`;
          else if (index === 2) shelfTitle = `More like ${primaryArtist}`;

          newSections.push({
            title: shelfTitle,
            items: tracks.slice(0, 10).map((t: any) => ({
              ...t,
              id: t.videoId,
              type: 'song'
            })) as any
          });
        }
      });

      const finalSections = [...newSections, ...filteredSections];
      cachedHomeSections = finalSections;
      setSections(finalSections);
    } catch (err) {
      console.error('Failed to load home', err);
    } finally {
      setLoading(false);
      if (isRefreshAction) {
        setRefreshing(false);
      }
    }
  }, []);

  const onRefresh = useCallback(() => {
    loadHome(true, true);
  }, [loadHome]);

  useEffect(() => {
    loadHome();
  }, [loadHome]);

  const handlePlayTrack = useCallback(async (item: SearchResult | Track, list: (SearchResult | Track)[]) => {
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
      
      const mappedTrack: Track = {
          videoId: videoId!,
          title: item.title,
          artist: item.channelTitle || ('artist' in item ? item.artist : 'Unknown Artist') || 'Unknown Artist',
          thumbnailUrl: item.thumbnailUrl,
          durationMs: item.durationMs || 0
      };
      
      setQueue([mappedTrack], 0);
      setCurrentTrack(mappedTrack);

      YouTubeSearchService.getUpNext(mappedTrack.videoId).then(upNextTracks => {
        if (upNextTracks.length > 0) {
           const currentStore = usePlayerStore.getState();
           if (currentStore.currentTrack?.videoId === mappedTrack.videoId) {
              setQueue([mappedTrack, ...upNextTracks], 0);
           }
        }
      }).catch(err => console.error("Failed to fetch UpNext", err));
    } catch (error) {
      console.error("Playback failed:", error);
    }
  }, [router, setCurrentTrack, setQueue]);

  const renderSection = ({ item: section, index }: { item: HomeSection, index: number }) => {
    const titleLower = section.title.toLowerCase();
    const isSongSection = section.items[0]?.type === 'song';
    const isArtistSection = section.items[0]?.type === 'artist' || titleLower.includes('artist');

    if (titleLower.includes('jam again')) {
      return (
        <View style={styles.sectionContainer}>
          <SectionHeader title={section.title} />
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
            data={section.items}
            keyExtractor={(item, i) => (item.id || item.videoId) + '-jam-' + i}
            renderItem={({ item }) => (
              <PlaylistCard
                id={item.id}
                title={item.title}
                subtitle={item.channelTitle || (item as any).artist || 'Unknown Artist'}
                thumbnailUrl={item.thumbnailUrl}
                onPress={() => handlePlayTrack(item, section.items)}
              />
            )}
          />
        </View>
      );
    }

    if (titleLower.includes('speed dial')) {
      const columnWidth = width * 0.88;
      const gap = 8;
      const itemWidth = (columnWidth - (gap * 2)) / 3;
      
      const chunkSize = 9;
      const chunks = [];
      for (let i = 0; i < section.items.length; i += chunkSize) {
        chunks.push(section.items.slice(i, i + chunkSize));
      }

      return (
        <View style={styles.sectionContainer}>
          <SectionHeader title={section.title} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
            snapToInterval={columnWidth + 16}
            decelerationRate="fast"
            snapToAlignment="start"
          >
            {chunks.map((chunk, chunkIdx) => (
              <View 
                key={`chunk-${chunkIdx}`} 
                style={{ 
                  width: columnWidth, 
                  flexDirection: 'row', 
                  flexWrap: 'wrap', 
                  gap: gap,
                  marginRight: 16
                }}
              >
                {chunk.map((item, i) => (
                  <SpeedDialCard
                    key={`${item.id || item.videoId}-${i}`}
                    title={item.title}
                    thumbnailUrl={item.thumbnailUrl}
                    isPlayable={item.type === 'song'}
                    onPress={() => {
                      if (item.type === 'song') handlePlayTrack(item, section.items);
                      else if (item.type === 'artist') router.push(`/artist/${item.id}`);
                      else if (item.type === 'album') router.push(`/album/${item.id}`);
                      else if (item.type === 'playlist') router.push(`/playlist/${item.id}`);
                    }}
                    width={itemWidth}
                  />
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      );
    }

    const isGridSimilarSection = titleLower.includes('similar to') || titleLower.includes('because you listened to') || titleLower.includes('more like');

    if (isGridSimilarSection) {
      return (
        <View style={styles.sectionContainer}>
          <SectionHeader title={section.title} />
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
            data={section.items}
            keyExtractor={(item, i) => item.id || `${i}`}
            renderItem={({ item }) => (
              <SongGridCard
                track={{
                  videoId: item.videoId || item.id || '',
                  title: item.title,
                  artist: item.channelTitle || (item as any).artist || 'Unknown Artist',
                  thumbnailUrl: item.thumbnailUrl,
                  durationMs: item.durationMs || 0,
                }}
                onPress={() => handlePlayTrack(item, section.items)}
                width={120}
              />
            )}
          />
        </View>
      );
    }

    if (isSongSection) {
      const chunkSize = 4;
      const chunks = [];
      for (let i = 0; i < section.items.length; i += chunkSize) {
        chunks.push(section.items.slice(i, i + chunkSize));
      }

      const columnWidth = width * 0.88;

      return (
        <View style={styles.sectionContainer}>
          <SectionHeader title={section.title} />
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
            snapToInterval={columnWidth + 16}
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
                        artist: item.channelTitle || (item as any).artist || 'Unknown Artist',
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
        <View style={styles.sectionContainer}>
          <SectionHeader title={section.title} />
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
            data={section.items}
            keyExtractor={(item, i) => item.id || `${i}`}
            renderItem={({ item }) => (
              <ArtistCard
                id={item.id}
                name={item.channelTitle || item.title || "Artist"}
                thumbnailUrl={item.thumbnailUrl}
                onPress={() => item.id && router.push(`/artist/${item.id}`)}
              />
            )}
          />
        </View>
      );
    }

    return (
      <View style={styles.sectionContainer}>
        <SectionHeader title={section.title} />
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
          data={section.items}
          keyExtractor={(item, i) => item.id || `${i}`}
          renderItem={({ item }) => (
            <PlaylistCard
              id={item.id}
              title={item.title}
              subtitle={item.channelTitle}
              thumbnailUrl={item.thumbnailUrl}
              onPress={() => handlePlayTrack(item, section.items)}
            />
          )}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <ScreenWrapper style={styles.container}>
        <TopBar title="Home" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1db954" />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper style={styles.container}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top, backgroundColor: '#000', zIndex: 101 }} />
      <Animated.View 
        style={{ 
          transform: [{ translateY }], 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          zIndex: 100,
          backgroundColor: 'rgba(0,0,0,0.85)'
        }}
      >
        <TopBar title="Home" />
      </Animated.View>
      <Animated.FlatList
        data={sections}
        renderItem={renderSection}
        keyExtractor={(item, index) => `${item.title}-${index}`}
        contentContainerStyle={[styles.content, { paddingTop: 100 }]}
        removeClippedSubviews={true}
        initialNumToRender={4}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#1db954"
            colors={["#1db954"]} 
            progressViewOffset={100}
          />
        }
      />
    </ScreenWrapper>
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
