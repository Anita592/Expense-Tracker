import React, { createContext, useContext, useEffect, useState } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { requestNotificationPermission } from '../utils/notifications';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (!res.data?.token || !res.data?.user) {
      throw new Error('Server did not return a valid login session.');
    }
    await AsyncStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res;
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
