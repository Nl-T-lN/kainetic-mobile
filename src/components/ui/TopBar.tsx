import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Search, User } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TopBar() {
  const insets = useSafeAreaInsets();

  return (
    <BlurView intensity={80} tint="dark" style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}>
      <View style={styles.inner}>
        <Image 
          source={require('../../../assets/images/favicon.png')} 
          style={styles.logo} 
          resizeMode="contain" 
        />
        
        <View style={styles.searchContainer}>
          <Search color="#888" size={18} style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search songs, artists..."
            placeholderTextColor="#888"
            returnKeyType="search"
          />
        </View>

        <TouchableOpacity style={styles.profileButton}>
          <User color="#fff" size={20} />
        </TouchableOpacity>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  logo: {
    width: 32,
    height: 32,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 99,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  }
});
