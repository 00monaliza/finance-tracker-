// API Configuration
// For iOS simulator, use your Mac's IP address instead of localhost
// Find it with: ifconfig | grep "inet " | grep -v 127.0.0.1

const API_BASE_URL = __DEV__
  ? 'http://localhost:8000'  // Change to your Mac's IP for physical device: 'http://192.168.x.x:8000'
  : 'https://your-production-api.com';

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};
