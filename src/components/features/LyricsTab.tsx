import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { usePlayerStore } from '@/store/playerStore';
import { useLyrics } from '@/hooks/useLyrics';

interface LyricsTabProps {
  onScroll?: (event: any) => void;
}

export default function LyricsTab({ onScroll }: LyricsTabProps) {
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const positionMs = usePlayerStore((state) => state.positionMs);
  const { lyrics, plainLyrics, isLoading } = useLyrics(currentTrack);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Find current active lyric index
  let activeIndex = -1;
  if (lyrics.length > 0) {
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (positionMs >= lyrics[i].startTimeMs) {
        activeIndex = i;
        break;
      }
    }
  }

  // Scroll to active lyric
  useEffect(() => {
    if (activeIndex >= 0 && scrollViewRef.current) {
      // Rough estimation to keep active line centered
      const yOffset = Math.max(0, activeIndex * 40 - 100);
      scrollViewRef.current.scrollTo({ y: yOffset, animated: true });
    }
  }, [activeIndex]);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (lyrics.length === 0 && !plainLyrics) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No lyrics found for this track.</Text>
      </View>
    );
  }

  if (lyrics.length > 0) {
    return (
      <ScrollView 
        ref={scrollViewRef}
        style={styles.container} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {lyrics.map((line, index) => {
          const isActive = index === activeIndex;
          const isPassed = index < activeIndex;
          
          return (
            <Text 
              key={index} 
              style={[
                styles.lyricLine, 
                isActive && styles.activeLyric,
                isPassed && styles.passedLyric
              ]}
            >
              {line.text || "♪"}
            </Text>
          );
        })}
      </ScrollView>
    );
  }

  // Fallback to plain lyrics
  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      <Text style={styles.plainLyrics}>{plainLyrics}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  contentContainer: {
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    textAlign: 'center',
  },
  lyricLine: {
    fontSize: 22,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 16,
    textAlign: 'left',
    lineHeight: 32,
  },
  activeLyric: {
    color: '#fff',
    fontSize: 26,
  },
  passedLyric: {
    color: 'rgba(255,255,255,0.8)',
  },
  plainLyrics: {
    fontSize: 18,
    color: '#fff',
    lineHeight: 30,
    textAlign: 'center',
  }
});
