import React, {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // LOGIN
  const login = (userData, token) => {
    if (token) {
      localStorage.setItem("token", token);

      axios.defaults.headers.common["Authorization"] =
        `Bearer ${token}`;
    }

    setUser(userData);
  };

  // LOGOUT
  const logout = async () => {
    try {
      await axios.get("/api/auth/logout");
    } catch (err) {
      console.error(
        "Logout error:",
        err.response?.data || err.message
      );
    } finally {
      setUser(null);

      localStorage.removeItem("token");

      delete axios.defaults.headers.common["Authorization"];
    }
  };

  // RESTORE USER SESSION
  useEffect(() => {
    let active = true;

    const fetchUser = async () => {
      try {
        const savedToken = localStorage.getItem("token");

        if (savedToken) {
          axios.defaults.headers.common["Authorization"] =
            `Bearer ${savedToken}`;
        }

        const response = await axios.get("/api/auth/me");

        if (active) {
          setUser(response.data.user);
        }

      } catch (err) {
        console.error(
          "Authentication check:",
          err.response?.data || err.message
        );

        if (active) {
          setUser(null);

          localStorage.removeItem("token");

          delete axios.defaults.headers.common["Authorization"];
        }

      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchUser();

    return () => {
      active = false;
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
