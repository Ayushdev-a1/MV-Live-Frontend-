import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state

  // Fix: Use import.meta.env instead of process.env
  const API_BASE_URL = import.meta.env.VITE_API_ADDRESS;

  // Function to check authentication status
  const checkAuthStatus = async () => {
    try {
      // First try with session credentials
      const response = await fetch('https://mv-live-backend.vercel.app/auth/status', {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.authenticated) {
        setUser(data.user);
        setIsAuthenticated(true);
        return true;
      }
      
      // If session fails, try with JWT token
      const token = localStorage.getItem('token');
      if (token) {
        const tokenResponse = await fetch('https://mv-live-backend.vercel.app/auth/status', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const tokenData = await tokenResponse.json();
        
        if (tokenData.authenticated) {
          setUser(tokenData.user);
          setIsAuthenticated(true);
          return true;
        }
      }
      
      // As last resort, try with Google ID
      const googleId = localStorage.getItem('googleId');
      if (googleId) {
        const googleResponse = await fetch('https://mv-live-backend.vercel.app/auth/status', {
          headers: {
            'Authorization': googleId
          }
        });
        
        const googleData = await googleResponse.json();
        
        if (googleData.authenticated) {
          setUser(googleData.user);
          setIsAuthenticated(true);
          return true;
        }
      }
      
      setIsAuthenticated(false);
      return false;
    } catch (error) {
      console.error('Auth status check failed:', error);
      setIsAuthenticated(false);
      return false;
    }
  };

  // Check authentication status on initial load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Login function
  const login = async () => {
    try {
      await checkAuthStatus(); // Re-check authentication status after login
      if (isAuthenticated) {
        toast.success("✅ Login Successful!");
      } else {
        toast.error("⚠️ Login Failed");
      }
    } catch (error) {
      console.error("Login failed", error);
      toast.error("⚠️ Login Failed");
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/auth/logout`, {}, { 
        withCredentials: true,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('user');
      toast.success("👋 Logged Out Successfully!");
      window.location.href = "/"; // Redirect to home page after logout
    } catch (error) {
      console.error("Logout failed", error);
      
      // Clear local state even if server logout fails
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('user');
      
      toast.error("⚠️ Logout Failed");
      window.location.href = "/"; // Redirect to home anyway
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
