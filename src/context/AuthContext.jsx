import { createContext, useContext, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext({
  user: null,
  login: async () => {},
  logout: () => {}
});

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

  const login = async (type, credentials) => {
    try {
      console.log('Tentative de connexion avec:', { type, credentials });
      const response = await axios.post(`http://localhost:8081/login/${type}`, credentials);
      console.log('Réponse du serveur:', response.data);
      
      const { user } = response.data;
      
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Configure axios avec l'ID utilisateur pour les requêtes futures
      axios.defaults.headers.common['user-id'] = user.id;
      
      return { success: true };
    } catch (error) {
      console.error('Erreur de connexion:', error.response?.data || error.message);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Erreur lors de la connexion' 
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['user-id'];
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}