import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  username: string;
  displayName: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Static user database for internal use
const USERS = [
  { username: 'Mark', password: 'jusfres1', displayName: 'Mark' },
  { username: 'Ashok', password: 'jusfres2', displayName: 'Ashok' },
  { username: 'Fahamidha', password: 'jusfres3', displayName: 'Fahamidha' },
  { username: 'Mafaz', password: 'jusfres4', displayName: 'Mafaz' },
];

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session in localStorage
    const savedUser = localStorage.getItem('maintenance_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    const foundUser = USERS.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );

    if (foundUser) {
      const userObj = { username: foundUser.username, displayName: foundUser.displayName };
      setUser(userObj);
      localStorage.setItem('maintenance_user', JSON.stringify(userObj));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('maintenance_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};