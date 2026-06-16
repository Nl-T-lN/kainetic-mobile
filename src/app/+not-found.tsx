import { Redirect, usePathname } from 'expo-router';
import { useEffect } from 'react';

export default function NotFoundScreen() {
  const pathname = usePathname();
  
  useEffect(() => {
    console.log("[Router] Unmatched route caught:", pathname, "Redirecting to /");
  }, [pathname]);

  // When clicking the react-native-track-player notification, Android fires an intent
  // that Expo Router sometimes fails to match to a known route.
  // We simply redirect to the root which resolves to the home tabs.
  return <Redirect href="/" />;
}
