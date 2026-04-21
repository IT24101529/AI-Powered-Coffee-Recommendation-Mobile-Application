import Constants from 'expo-constants';
import { Platform } from 'react-native';

const IPV4_PATTERN = /^(\d{1,3}\.){3}\d{1,3}$/;

const isIpv4Host = (host) => IPV4_PATTERN.test(host || '');

const getExpoHost = () => {
  const candidateUris = [
    Constants?.expoConfig?.hostUri,
    Constants?.manifest2?.extra?.expoClient?.hostUri,
    Constants?.manifest?.debuggerHost,
  ].filter(Boolean);

  for (const uri of candidateUris) {
    const host = String(uri).split(':')[0];
    if (isIpv4Host(host) || host === 'localhost') {
      return host;
    }
  }
  return null;
};

const getDefaultHost = () => {
  const envHost = process.env.EXPO_PUBLIC_API_HOST;
  if (envHost) {
    console.log('[API] Using host from env:', envHost);
    return envHost;
  }

  const expoHost = getExpoHost();
  if (expoHost && expoHost !== 'localhost') {
    console.log('[API] Auto-detected Expo host:', expoHost);
    return expoHost;
  }

  if (Platform.OS === 'android' && Constants?.isDevice === false) {
    console.log('[API] Android Emulator detected, using 10.0.2.2');
    return '10.0.2.2';
  }

  console.log('[API] Fallback to localhost (127.0.0.1)');
  return '127.0.0.1';
};

export const BASE_URL = `http://${getDefaultHost()}:5000`;

const buildLocalUrl = (port) => `http://${getDefaultHost()}:${port}`;

const API_URLS = {
  CHATBOT_API: process.env.EXPO_PUBLIC_CHATBOT_API || buildLocalUrl(8000),
  SENTIMENT_API: process.env.EXPO_PUBLIC_SENTIMENT_API || buildLocalUrl(8001),
  CONTEXT_API: process.env.EXPO_PUBLIC_CONTEXT_API || buildLocalUrl(8002),
  PRODUCTS_API: process.env.EXPO_PUBLIC_PRODUCTS_API || buildLocalUrl(8003),
  TRENDS_API: process.env.EXPO_PUBLIC_TRENDS_API || buildLocalUrl(8004),
  FEEDBACK_API: process.env.EXPO_PUBLIC_FEEDBACK_API || buildLocalUrl(8005),
};

export default API_URLS;
