import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { storage } from '@/lib/storage';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const userId = await storage.getUserId();
      setIsAuthenticated(!!userId);
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  if (isLoading) {
    return null; // Or a loading spinner
  }

  return <Redirect href={isAuthenticated ? '/(tabs)' : '/(auth)'} />;
}
