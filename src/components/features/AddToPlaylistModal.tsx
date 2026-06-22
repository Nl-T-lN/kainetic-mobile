import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Alert } from 'react-native';
import { Image } from 'expo-image';
import { X, Plus, Music, Check, FolderPlus } from 'lucide-react-native';
import type { Track } from '@/types/music';
import { useLibraryStore } from '@/store/libraryStore';

interface AddToPlaylistModalProps {
  visible: boolean;
  track: Track;
  onClose: () => void;
  onAdded?: () => void;
}

export function AddToPlaylistModal({ visible, track, onClose, onAdded }: AddToPlaylistModalProps) {
  const playlists = useLibraryStore(state => state.playlists);
  const addTrackToPlaylist = useLibraryStore(state => state.addTrackToPlaylist);
  const removeTrackFromPlaylist = useLibraryStore(state => state.removeTrackFromPlaylist);
  const createPlaylist = useLibraryStore(state => state.createPlaylist);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const handleToggle = (playlistId: string, isAdded: boolean) => {
    if (isAdded) {
      removeTrackFromPlaylist(playlistId, track.videoId);
    } else {
      addTrackToPlaylist(playlistId, track);
      if (onAdded) onAdded();
    }
  };

  const handleCreateAndAdd = () => {
    if (newPlaylistName.trim().length > 0) {
      const newId = createPlaylist(newPlaylistName.trim());
      addTrackToPlaylist(newId, track);
      setNewPlaylistName('');
      setIsCreating(false);
      if (onAdded) onAdded();
    }
  };

  const handleCreatePrompt = () => {
    Alert.prompt(
      "New Playlist",
      "Enter a name for your playlist",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Create", 
          onPress: (name) => {
            if (name && name.trim().length > 0) {
              const newId = createPlaylist(name.trim());
              addTrackToPlaylist(newId, track);
              if (onAdded) onAdded();
            }
          }
        }
      ],
      "plain-text"
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
              style={styles.modalCard}
            >
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Save to Playlist</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <X size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                {/* Create New Playlist Button */}
                {Platform.OS === 'ios' ? (
                  <TouchableOpacity style={styles.createBtn} onPress={handleCreatePrompt}>
                    <View style={styles.createIcon}>
                      <Plus size={24} color="#fff" />
                    </View>
                    <Text style={styles.createText}>New Playlist</Text>
                  </TouchableOpacity>
                ) : (
                  // Android prompt alternative or inline creation
                  <View style={styles.inlineCreate}>
                    <TouchableOpacity 
                      style={[styles.createBtn, isCreating && { marginBottom: 12 }]} 
                      onPress={() => setIsCreating(!isCreating)}
                    >
                      <View style={styles.createIcon}>
                        {isCreating ? <X size={24} color="#fff" /> : <Plus size={24} color="#fff" />}
                      </View>
                      <Text style={styles.createText}>{isCreating ? 'Cancel' : 'New Playlist'}</Text>
                    </TouchableOpacity>
                    
                    {isCreating && (
                      <View style={styles.createInputRow}>
                        <TextInput 
                          style={styles.input} 
                          placeholder="Playlist name..." 
                          placeholderTextColor="#888"
                          value={newPlaylistName}
                          onChangeText={setNewPlaylistName}
                          autoFocus
                        />
                        <TouchableOpacity 
                          style={[styles.saveBtn, !newPlaylistName.trim() && { opacity: 0.5 }]} 
                          disabled={!newPlaylistName.trim()}
                          onPress={handleCreateAndAdd}
                        >
                          <Text style={styles.saveBtnText}>Create</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}

                <View style={styles.divider} />

                {playlists.length === 0 ? (
                  <View style={styles.emptyState}>
                    <FolderPlus size={40} color="rgba(255,255,255,0.2)" style={{ marginBottom: 16 }} />
                    <Text style={styles.emptyText}>You haven't created any playlists yet.</Text>
                  </View>
                ) : (
                  playlists.map(playlist => {
                    const isAdded = playlist.tracks.some(t => t.videoId === track.videoId);
                    return (
                      <TouchableOpacity 
                        key={playlist.id} 
                        style={styles.playlistRow}
                        onPress={() => handleToggle(playlist.id, isAdded)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.thumb}>
                          {playlist.coverUrl ? (
                            <Image source={{ uri: playlist.coverUrl }} style={styles.thumbImage} contentFit="cover" />
                          ) : (
                            <Music size={20} color="rgba(255,255,255,0.4)" />
                          )}
                        </View>
                        <View style={styles.info}>
                          <Text style={styles.name} numberOfLines={1}>{playlist.name}</Text>
                          <Text style={styles.count}>{playlist.tracks.length} songs</Text>
                        </View>
                        <View style={styles.action}>
                          {isAdded ? <Check size={24} color="#54F790" /> : <Plus size={24} color="rgba(255,255,255,0.3)" />}
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: '50%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
  },
  body: {
    padding: 16,
    paddingBottom: 40,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  createIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  createText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  inlineCreate: {
    marginBottom: 8,
  },
  createInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  saveBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 12,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  info: {
    flex: 1,
  },
  name: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  count: {
    color: '#888',
    fontSize: 13,
  },
  action: {
    paddingLeft: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#888',
    fontSize: 15,
  }
});
