import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "./axiosInstance";

export const getAuthToken = async (): Promise<string> => {
  const token =
    (await AsyncStorage.getItem("token")) ||
    (await AsyncStorage.getItem("authToken"));

  return token || "";
};

export const apiFetch = async (path: string, options: any = {}) => {
  const res = await API({
    url: `/rfq${path}`,
    method: options.method || "GET",
    data: options.body ? JSON.parse(options.body) : undefined,
    headers: options.headers,
  });

  return res.data;
};
