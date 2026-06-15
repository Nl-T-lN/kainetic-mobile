import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import TopBar from '@/components/ui/TopBar';
import type { Track } from '@/types/music';

const MOODS = [
  'Chill', 'Workout', 'Focus', 'Party', 'Sleep', 'Romance', 'Sad', 'Upbeat'
];

export default function ExploreTab() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TopBar />
      <ScrollView contentContainerStyle={styles.content}>
        
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
  }
});
