import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        {/* We will define our tabs and screens inside this Stack later */}
        <Stack.Screen name="index" />
      </Stack>
    </>
  );
}
