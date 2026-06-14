import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

interface YouTubeWebViewProps {
  videoId: string;
}

export default function YouTubeWebView({ videoId }: YouTubeWebViewProps) {
  if (!videoId) return null;

  // The "normal iframe import" style using a WebView
  // This helps test if the phone's networking and media stack can play YT content
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&controls=1`;

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: embedUrl }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        originWhitelist={['*']}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 220,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
