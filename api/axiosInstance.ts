import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API = axios.create({
  baseURL: "https://patchpaybackend.onrender.com/api",
  timeout: 10000,
});

API.interceptors.request.use(async (config) => {
  const token =
    (await AsyncStorage.getItem("token")) ||
    (await AsyncStorage.getItem("authToken"));

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default API;
