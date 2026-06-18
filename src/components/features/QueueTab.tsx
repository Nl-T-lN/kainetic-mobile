import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import Animated from 'react-native-reanimated';
import { usePlayerStore } from '@/store/playerStore';
import { MoreVertical } from 'lucide-react-native';

interface QueueTabProps {
  onScroll?: (event: any) => void;
  paddingBottom?: number;
}

const TrackItem = React.memo(({ item, index, queueIndex, onPlay }: any) => {
  const isPlaying = index === queueIndex;
  
  return (
    <TouchableOpacity 
      style={[styles.trackItem, isPlaying && styles.playingTrackItem]}
      onPress={() => onPlay(index)}
    >
      <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} />
      <View style={styles.trackInfo}>
        <Text style={[styles.title, isPlaying && styles.playingText]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>{item.artist}</Text>
      </View>
      <TouchableOpacity style={styles.moreButton}>
        <MoreVertical color="rgba(255,255,255,0.6)" size={20} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

export default function QueueTab({ onScroll, paddingBottom }: QueueTabProps) {
  const queue = usePlayerStore((state) => state.queue);
  const queueIndex = usePlayerStore((state) => state.queueIndex);
  const setQueue = usePlayerStore((state) => state.setQueue);
  
  const flatListRef = useRef<Animated.FlatList<any>>(null);

  if (!queue || queue.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Your queue is empty</Text>
      </View>
    );
  }

  const handlePlayTrack = (index: number) => {
    setQueue(queue, index);
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => {
    return <TrackItem item={item} index={index} queueIndex={queueIndex} onPlay={handlePlayTrack} />;
  };

  return (
    <View style={styles.container}>
      <View style={styles.queueHeaderContainer}>
        <View>
          <Text style={styles.queueHeaderSub}>Playing from</Text>
          <Text style={styles.queueHeaderMain}>Your Queue</Text>
        </View>
        <TouchableOpacity style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
      <Animated.FlatList
        ref={flatListRef}
        data={queue}
        keyExtractor={(item, index) => `${item.videoId}-${index}`}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: paddingBottom || 60 }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 8,
    width: '100%',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  playingTrackItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#333',
  },
  trackInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
  },
  playingText: {
    color: '#fff',
    fontWeight: '800',
  },
  artist: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
  moreButton: {
    padding: 8,
  },
  queueHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    marginBottom: 16,
    marginTop: 16,
  },
  queueHeaderSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginBottom: 2,
  },
  queueHeaderMain: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  }
});
