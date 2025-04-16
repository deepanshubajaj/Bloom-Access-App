import React, { useState, useEffect } from 'react';

// React navigation stack
import RootStack from './navigators/RootStack';

// SplashScreen
import * as SplashScreen from 'expo-splash-screen';

// Async-Storage
import AsyncStorage from '@react-native-async-storage/async-storage';

// Credentials Context
import { CredentialsContext } from './components/CredentialsContext';

export default function App() {
  const [appReady, setAppReady] = useState(false);
  const [storedCredentials, setStoredCredentials] = useState("");

  const checkLoginCredentials = async () => {
    try {
      const result = await AsyncStorage.getItem('bloomAccessCredentials');
      if (result !== null) {
        setStoredCredentials(JSON.parse(result));
      } else {
        setStoredCredentials(null);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const loadResources = async () => {
      // Prevent splash screen from hiding while the resources are loading
      await SplashScreen.preventAutoHideAsync();
      await checkLoginCredentials();
      setAppReady(true);
      // Hide the splash screen once resources are ready
      await SplashScreen.hideAsync();
    };

    loadResources();
  }, []);

  if (!appReady) {
    return null; // You can display a custom loading screen here if necessary
  }

  return (
    <CredentialsContext.Provider value={{ storedCredentials, setStoredCredentials }}>
      <RootStack />
    </CredentialsContext.Provider>
  );
}