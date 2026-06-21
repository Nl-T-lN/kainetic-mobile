import React, { useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { usePlayerStore } from '@/store/playerStore';
import { MoreVertical, GripVertical } from 'lucide-react-native';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';

interface QueueTabProps {
  onScroll?: (event: any) => void;
  paddingBottom?: number;
}

const TrackItem = React.memo(({ item, getIndex, drag, isActive, queueIndex, onPlay }: any) => {
  const index = getIndex();
  const isPlaying = index === queueIndex;
  
  return (
    <ScaleDecorator>
      <TouchableOpacity 
        style={[styles.trackItem, isPlaying && styles.playingTrackItem, isActive && styles.activeTrackItem]}
        onPress={() => onPlay(index)}
        activeOpacity={1}
        disabled={isActive}
      >
        <TouchableOpacity onLongPress={drag} delayLongPress={100} style={styles.dragHandle}>
          <GripVertical color="rgba(255,255,255,0.4)" size={20} />
        </TouchableOpacity>

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
    </ScaleDecorator>
  );
});

export default function QueueTab({ onScroll, paddingBottom }: QueueTabProps) {
  const queue = usePlayerStore((state) => state.queue);
  const queueIndex = usePlayerStore((state) => state.queueIndex);
  const setQueue = usePlayerStore((state) => state.setQueue);

  if (!queue || queue.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Your queue is empty</Text>
      </View>
    );
  }

  const displayQueue = queue;

  const handlePlayTrack = React.useCallback((index: number) => {
    setQueue(queue, index);
  }, [queue, setQueue]);

  const handleDragEnd = ({ data }: { data: any[] }) => {
    const currentTrack = queue[queueIndex];
    const newIndex = data.findIndex(t => t.videoId === currentTrack?.videoId);
    setQueue(data, newIndex !== -1 ? newIndex : 0);
  };

  const renderItem = React.useCallback(({ item, getIndex, drag, isActive }: RenderItemParams<any>) => {
    return (
      <TrackItem 
        item={item} 
        getIndex={getIndex} 
        drag={drag} 
        isActive={isActive} 
        queueIndex={queueIndex} 
        onPlay={handlePlayTrack} 
      />
    );
  }, [queueIndex, handlePlayTrack]);

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
      <DraggableFlatList
        data={displayQueue}
        keyExtractor={(item) => item.videoId}
        renderItem={renderItem}
        onDragEnd={handleDragEnd}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: paddingBottom || 60 }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={false}
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
  activeTrackItem: {
    backgroundColor: '#282828',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  dragHandle: {
    padding: 8,
    marginRight: 4,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#333',
  },
  trackInfo: {
    flex: 1,
    marginLeft: 10,
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
