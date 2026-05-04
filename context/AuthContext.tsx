import React, { createContext, useEffect, useState } from "react";
import { getToken, saveToken, removeToken } from "../store/tokenStorage";

export const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: any) => {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkLogin();
  }, []);

  const checkLogin = async () => {
    const token = await getToken();

    if (token) {
      setUserToken(token);
    }

    setLoading(false);
  };

  const login = async (token: string) => {
    await saveToken(token);
    setUserToken(token);
  };

  const logout = async () => {
    await removeToken();
    setUserToken(null);
  };

  return (
    <AuthContext.Provider value={{ userToken, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
