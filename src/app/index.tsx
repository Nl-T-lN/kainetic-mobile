import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kainetic Mobile</Text>
      <Text style={styles.subtitle}>The foundation is ready.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // This means "take up the full screen height"
    backgroundColor: '#0a0a0a', // Our dark theme background
    justifyContent: 'center', // Centers vertically
    alignItems: 'center', // Centers horizontally
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#888',
    marginTop: 10,
  }
});
