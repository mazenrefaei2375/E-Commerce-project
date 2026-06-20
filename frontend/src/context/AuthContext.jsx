import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.is_staff || user?.is_superuser;
  const isSeller = user?.is_seller;
  const isCustomer = !!user && !isAdmin && !isSeller;
  const canSellerAddProducts = isSeller && user?.seller_is_active && user?.can_add_products;
  const isSellerActive = isSeller && user?.seller_is_active;

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      api.get('/auth/me/')
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const register = async (data) => {
    const res = await api.post('/auth/register/', data);
    return res.data;
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login/', { email, password });
    localStorage.setItem('access_token', res.data.access);
    localStorage.setItem('refresh_token', res.data.refresh);
    const userRes = await api.get('/auth/me/');
    setUser(userRes.data);
    return userRes.data;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const redirectPath = () => {
    if (isAdmin) return '/admin';
    if (isSeller) return '/seller';
    return '/';
  };

  return (
    <AuthContext.Provider value={{
      user, loading, isAdmin, isSeller, isCustomer,
      canSellerAddProducts, isSellerActive,
      register, login, logout, redirectPath,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
