import { Redirect, usePathname, useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function NotFoundScreen() {
  const pathname = usePathname();
  const router = useRouter();
  
  useEffect(() => {
    console.log("[Router] Unmatched route caught:", pathname);
    
    // When clicking the react-native-track-player notification, Android fires an intent
    // which Expo Router captures as a deep link.
    // Instead of resetting the app to home, we just go back to the previous screen.
    if (pathname.includes('notification.click')) {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    }
  }, [pathname, router]);

  if (pathname.includes('notification.click')) {
    return null; // Render nothing while we navigate back
  }

  return <Redirect href="/" />;
}
