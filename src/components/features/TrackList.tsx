import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList } from 'react-native';
import type { Track } from '@/types/music';
import { Play, MoreVertical, Plus } from 'lucide-react-native';
import { usePlayerStore } from '@/store/playerStore';
import { useRouter } from 'expo-router';

interface TrackListProps {
  tracks: Track[];
  onTrackSelect: (track: Track, index: number) => void;
  hideThumbnails?: boolean;
}

function formatDuration(ms: number) {
  if (!ms) return "--:--";
  const seconds = Math.floor(ms / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function TrackList({ tracks, onTrackSelect, hideThumbnails }: TrackListProps) {
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const router = useRouter();

  const renderItem = ({ item, index }: { item: Track; index: number }) => {
    const isActive = item.videoId === currentTrack?.videoId;

    return (
      <TouchableOpacity 
        style={[styles.trackItem, isActive && styles.activeTrackItem]}
        onPress={() => onTrackSelect(item, index)}
      >
        <View style={styles.rowIndex}>
          {isActive && isPlaying ? (
            <View style={styles.eqBars}>
               {/* Static representation of EQ bars for native since we don't have CSS keyframes easily, but we can just use an icon or static lines */}
               <View style={[styles.eqBar, { height: 12 }]} />
               <View style={[styles.eqBar, { height: 6 }]} />
               <View style={[styles.eqBar, { height: 14 }]} />
            </View>
          ) : isActive && !isPlaying ? (
             <Play size={14} color="#34d399" fill="#34d399" />
          ) : (
            <Text style={[styles.rowNumber, isActive && styles.activeRowNumber]}>{index + 1}</Text>
          )}
        </View>

        {!hideThumbnails && (
          <Image 
            source={{ uri: item.thumbnailUrl || "https://images.unsplash.com/photo-1619983081563-430f63602796?auto=format&fit=crop&q=80&w=200" }} 
            style={styles.thumbnail} 
          />
        )}

        <View style={styles.trackInfo}>
          <Text style={[styles.title, isActive && styles.activeTitle]} numberOfLines={1}>
            {item.title}
          </Text>
          <TouchableOpacity 
            onPress={() => {
              if (item.artistId) {
                router.push(`/artist/${item.artistId}`);
              } else if (item.artist || item.channelTitle) {
                router.push(`/search?q=${encodeURIComponent(item.artist || item.channelTitle || "")}`);
              }
            }}
          >
            <Text style={styles.artist} numberOfLines={1}>
              {item.artist || item.channelTitle || "Unknown Artist"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.duration}>{formatDuration(item.durationMs)}</Text>
        
        <TouchableOpacity style={styles.moreButton}>
          <MoreVertical size={16} color="rgba(255,255,255,0.4)" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {tracks.map((track, index) => (
        <React.Fragment key={`${track.videoId}-${index}`}>
          {renderItem({ item: track, index })}
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  activeTrackItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  rowIndex: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  rowNumber: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  activeRowNumber: {
    color: '#34d399', // accent color
  },
  eqBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 14,
    gap: 2,
  },
  eqBar: {
    width: 3,
    backgroundColor: '#34d399',
    borderRadius: 1,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 6,
    marginRight: 12,
  },
  trackInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  activeTitle: {
    color: '#34d399',
  },
  artist: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
  duration: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    marginLeft: 12,
  },
  moreButton: {
    padding: 8,
    marginLeft: 4,
  }
});
