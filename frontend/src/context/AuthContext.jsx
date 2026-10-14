import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  getMe,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
} from '@/lib/api';
const AuthContext = createContext(undefined);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchUser = useCallback(async () => {
    try {
      const data = await getMe();
      if (data) {
        const u = {
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role?.toLowerCase() || 'buyer',
          city: data.city,
          phone: data.phone,
        };
        setUser(u);
        return u;
      }
      setUser(null);
      return null;
    } catch {
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    void fetchUser();
    const handleUnauthorized = () => {
      setUser(null);
    };
    window.addEventListener('vutto-auth-unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('vutto-auth-unauthorized', handleUnauthorized);
    };
  }, [fetchUser]);
  const login = async (email, password) => {
    setIsLoading(true);
    try {
      await apiLogin(email, password);
      const profile = await getMe();
      const u = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role?.toLowerCase() || 'buyer',
        city: profile.city,
        phone: profile.phone,
      };
      setUser(u);
      return u;
    } finally {
      setIsLoading(false);
    }
  };
  const register = async (name, email, password) => {
    setIsLoading(true);
    try {
      await apiRegister(name, email, password);
      const profile = await getMe();
      const u = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role?.toLowerCase() || 'buyer',
        city: profile.city,
        phone: profile.phone,
      };
      setUser(u);
      return u;
    } finally {
      setIsLoading(false);
    }
  };
  const logout = async () => {
    setIsLoading(true);
    try {
      await apiLogout();
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        refreshUser: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
