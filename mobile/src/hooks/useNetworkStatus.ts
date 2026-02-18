import { useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Simple connectivity check via fetch
    const checkConnection = async () => {
      try {
        const response = await fetch('https://clients3.google.com/generate_204', {
          method: 'HEAD',
          mode: 'no-cors',
        });
        setIsOnline(true);
      } catch {
        setIsOnline(false);
      }
    };

    checkConnection();

    const handleAppStateChange = (state: AppStateStatus) => {
      if (state === 'active') {
        checkConnection();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    const interval = setInterval(checkConnection, 30000);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, []);

  return { isOnline };
}
