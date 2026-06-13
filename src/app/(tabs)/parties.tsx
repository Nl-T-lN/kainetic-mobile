import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import TopBar from '@/components/ui/TopBar';
import { Users, Plus, ArrowRight } from 'lucide-react-native';

export default function PartiesTab() {
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

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Join a Party</Text>
          <View style={styles.inputRow}>
            <TextInput 
              style={styles.input}
              placeholder="Enter Room Code"
              placeholderTextColor="#888"
            />
            <TouchableOpacity style={styles.joinButton}>
              <ArrowRight size={20} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.line} />
        </View>

        <TouchableOpacity style={styles.createButton} activeOpacity={0.8}>
          <Plus size={20} color="#fff" style={styles.createIcon} />
          <Text style={styles.createText}>Create New Party</Text>
        </TouchableOpacity>
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
  createIcon: {
    marginRight: 8,
  },
  createText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  }
});
