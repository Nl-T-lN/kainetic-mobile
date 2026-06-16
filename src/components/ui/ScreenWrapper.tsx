import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { usePlayerStore } from '@/store/playerStore';

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function ScreenWrapper({ children, style }: ScreenWrapperProps) {
  const dominantColor = usePlayerStore((state) => state.dominantColor);

  return (
    <View style={[styles.container, style]}>
      {dominantColor && (
        <>
          <View 
            style={[
              { 
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                backgroundColor: dominantColor, 
                opacity: 0.15,
                height: 400 
              }
            ]} 
          />
          <LinearGradient
            colors={['transparent', '#000000']}
            locations={[0, 1]}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 400 }}
          />
        </>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
