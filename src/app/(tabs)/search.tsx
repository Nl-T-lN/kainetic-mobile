import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import TopBar from '@/components/ui/TopBar';
import { Search } from 'lucide-react-native';
import TrackCard from '@/components/features/TrackCard';
import { YouTubeSearchService } from '@/services/YouTubeSearchService';
import { usePlayerStore } from '@/store/playerStore';
import { AudioService } from '@/services/AudioService';
import type { SearchResult, Track } from '@/types/music';

const MOODS = [
  'Chill', 'Workout', 'Focus', 'Party', 'Sleep', 'Romance', 'Sad', 'Upbeat'
];

export default function SearchTab() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  
  const setCurrentTrack = usePlayerStore((state) => state.setCurrentTrack);
  const setQueue = usePlayerStore((state) => state.setQueue);
  const [loadingTrackId, setLoadingTrackId] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await YouTubeSearchService.search(searchQuery, 'all');
      setSearchResults(results);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePlayTrack = async (track: SearchResult, index: number) => {
    try {
      if (track.type !== 'song' || !track.videoId) {
        if (track.type === 'playlist') router.push(`/playlist/${track.id}`);
        else if (track.type === 'album') router.push(`/album/${track.id}`);
        else if (track.type === 'artist') router.push(`/artist/${track.id}`);
        return;
      }
      
      setLoadingTrackId(track.videoId);
      
      const mappedTrack: Track = {
        videoId: track.videoId,
        title: track.title,
        artist: track.channelTitle,
        thumbnailUrl: track.thumbnailUrl,
        durationMs: track.durationMs
      };

      setQueue([mappedTrack], 0);
      setCurrentTrack(mappedTrack);
      await AudioService.playTrack(mappedTrack.videoId);
    } catch (error) {
      console.error("Playback failed:", error);
      alert("Failed to extract or play this track.");
    } finally {
      setLoadingTrackId(null);
    }
  };

  return (
    <View style={styles.container}>
      <TopBar />
      <View style={styles.searchBarContainer}>
        <Search color="#888" size={20} />
        <TextInput 
          style={styles.searchInput}
          placeholder="What do you want to play?"
          placeholderTextColor="#888"
          returnKeyType="search"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          autoFocus
        />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        
        {isSearching ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        ) : searchResults.length > 0 ? (
          <>
            <Text style={styles.sectionHeader}>Search Results</Text>
            <View style={styles.resultsGrid}>
              {searchResults.map((result, i) => (
                <View key={result.videoId || result.id || i} style={styles.resultItem}>
                  <TrackCard 
                    track={{
                      videoId: result.videoId || '',
                      title: result.title,
                      artist: result.channelTitle,
                      thumbnailUrl: result.thumbnailUrl,
                      durationMs: result.durationMs
                    }}
                    isLoading={loadingTrackId === result.videoId}
                    onPress={() => handlePlayTrack(result, i)}
                  />
                </View>
              ))}
            </View>
          </>
        ) : (
          <>
            <Text style={styles.sectionHeader}>Browse Moods</Text>
        
        <View style={styles.moodGrid}>
          {MOODS.map(mood => (
            <TouchableOpacity key={mood} style={styles.moodCard} activeOpacity={0.8}>
              <Text style={styles.moodText}>{mood}</Text>
            </TouchableOpacity>
          ))}
        </View>

            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderText}>Charts will appear here.</Text>
            </View>
          </>
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
  sectionHeader: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 16,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 32,
  },
  moodCard: {
    width: '48%',
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  moodText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  placeholderContainer: {
    paddingHorizontal: 16,
  },
  placeholderText: {
    color: '#666',
    fontSize: 15,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  resultsGrid: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  resultItem: {
    marginBottom: 8,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 16,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    marginLeft: 12,
  },
});
