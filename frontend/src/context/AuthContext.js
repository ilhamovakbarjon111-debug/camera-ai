import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { login, register, googleAuth, getMe, savePushToken } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        const data = await getMe();
        setUser(data.user);
      }
    } catch {
      await SecureStore.deleteItemAsync('token');
    } finally {
      setLoading(false);
    }
  };

  const registerPushToken = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;
      const { data } = await Notifications.getExpoPushTokenAsync();
      await savePushToken(data);
    } catch {}
  };

  const signIn = async (email, password) => {
    const data = await login({ email, password });
    await SecureStore.setItemAsync('token', data.token);
    setUser(data.user);
    await registerPushToken();
  };

  const signUp = async (name, email, password, level) => {
    const data = await register({ name, email, password, level });
    await SecureStore.setItemAsync('token', data.token);
    setUser(data.user);
    await registerPushToken();
  };

  const signInWithGoogle = async (googleData) => {
    const data = await googleAuth(googleData);
    await SecureStore.setItemAsync('token', data.token);
    setUser(data.user);
    await registerPushToken();
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync('token');
    setUser(null);
  };

  const updateUser = (updates) => setUser((prev) => ({ ...prev, ...updates }));

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithGoogle, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
