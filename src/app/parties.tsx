import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import TopBar from '@/components/ui/TopBar';
import { Users, Plus, ArrowRight, LogOut } from 'lucide-react-native';
import { ablySync } from '@/services/AblyService';
import { usePlayerStore } from '@/store/playerStore';

export default function PartiesTab() {
  const [roomCode, setRoomCode] = useState('');
  const [activeRoom, setActiveRoom] = useState<string | null>(ablySync.roomId);
  const [isHost, setIsHost] = useState(ablySync.isHost);

  const handleJoin = () => {
    if (!roomCode.trim()) return;
    ablySync.init(roomCode.trim(), false);
    setActiveRoom(roomCode.trim());
    setIsHost(false);
  };

  const handleCreate = () => {
    const newRoom = Math.random().toString(36).substring(2, 8).toUpperCase();
    ablySync.init(newRoom, true);
    setActiveRoom(newRoom);
    setIsHost(true);
    
    // Broadcast immediately so people joining get the current state
    ablySync.broadcastState();
  };

  const handleLeave = () => {
    ablySync.disconnect();
    setActiveRoom(null);
    setIsHost(false);
    usePlayerStore.getState().setIsPlaying(false);
  };

  return (
    <View style={styles.container}>
      <TopBar />
      <View style={styles.content}>
        <View style={styles.headerArea}>
          <View style={styles.iconContainer}>
            <Users size={32} color="#1db954" />
          </View>
          <Text style={styles.title}>Listen Along</Text>
          <Text style={styles.subtitle}>
            Join a party to listen to music in perfect sync with your friends, no matter where they are.
          </Text>
        </View>

        {activeRoom ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>You are in a Party!</Text>
            <View style={styles.activeRoomBox}>
              <Text style={styles.roomCodeLabel}>Room Code</Text>
              <Text style={styles.roomCodeValue}>{activeRoom}</Text>
            </View>
            <Text style={styles.roleText}>Role: {isHost ? 'Host (You control playback)' : 'Guest (Listening to host)'}</Text>
            
            <TouchableOpacity style={styles.leaveButton} onPress={handleLeave}>
              <LogOut size={20} color="#fff" style={styles.createIcon} />
              <Text style={styles.createText}>Leave Party</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Join a Party</Text>
              <View style={styles.inputRow}>
                <TextInput 
                  style={styles.input}
                  placeholder="Enter Room Code"
                  placeholderTextColor="#888"
                  value={roomCode}
                  onChangeText={setRoomCode}
                  autoCapitalize="characters"
                />
                <TouchableOpacity style={styles.joinButton} onPress={handleJoin}>
                  <ArrowRight size={20} color="#000" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.line} />
            </View>

            <TouchableOpacity style={styles.createButton} activeOpacity={0.8} onPress={handleCreate}>
              <Plus size={20} color="#fff" style={styles.createIcon} />
              <Text style={styles.createText}>Create New Party</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    paddingBottom: 160,
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#aaa',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  joinButton: {
    width: 48,
    height: 48,
    backgroundColor: '#1db954',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  orText: {
    color: '#666',
    paddingHorizontal: 16,
    fontWeight: '600',
  },
  createButton: {
    flexDirection: 'row',
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  leaveButton: {
    flexDirection: 'row',
    height: 48,
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  createIcon: {
    marginRight: 8,
  },
  createText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  activeRoomBox: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  roomCodeLabel: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 4,
  },
  roomCodeValue: {
    color: '#1db954',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  roleText: {
    color: '#ddd',
    fontSize: 14,
    textAlign: 'center',
  }
});
