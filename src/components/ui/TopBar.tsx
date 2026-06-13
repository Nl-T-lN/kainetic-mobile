import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { User, Settings, Radio } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function TopBar() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}>
      <View style={styles.inner}>
        <Text style={styles.logoText}>kainetic</Text>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/parties')}>
            <Radio color="#fff" size={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Settings color="#fff" size={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileButton}>
            <User color="#000" size={20} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 12,
    backgroundColor: 'transparent',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  logoText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1db954',
    justifyContent: 'center',
    alignItems: 'center',
  }
});
