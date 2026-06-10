import axios, { InternalAxiosRequestConfig } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AxiosRequestConfigWithMeta extends InternalAxiosRequestConfig {
  metadata?: {
    startTime: number;
  };
}

const API = axios.create({
  baseURL: "https://patchpaybackend.onrender.com/api",
  timeout: 20000,
});

API.interceptors.request.use(async (config: AxiosRequestConfigWithMeta) => {
  const token =
    (await AsyncStorage.getItem("token")) ||
    (await AsyncStorage.getItem("authToken"));

  config.metadata = {
    startTime: Date.now(),
  };

  console.log("🚀 REQUEST:", config.method?.toUpperCase(), config.url);

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

API.interceptors.response.use(
  (response) => {
    const duration =
      Date.now() -
      ((response.config as AxiosRequestConfigWithMeta).metadata?.startTime ||
        Date.now());

    console.log(
      "✅ RESPONSE:",
      response.config.url,
      response.status,
      `${duration}ms`,
    );

    return response;
  },
  (error) => {
    const duration =
      Date.now() -
      ((error.config as AxiosRequestConfigWithMeta)?.metadata?.startTime ||
        Date.now());

    console.log("❌ ERROR:", error.config?.url, error.message, `${duration}ms`);

    return Promise.reject(error);
  },
);

export default API;
