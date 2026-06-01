import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "./axiosInstance";

export const getAuthToken = async (): Promise<string> => {
  const token = await AsyncStorage.getItem("token");

  return token || "";
};

export const apiFetch = async (path: string, options: any = {}) => {
  const token = await getAuthToken();

  console.log("🚀 API Path:", path);
  console.log("🔐 Token used:", token);
  console.log("📦 Request body:", options.body);

  const res = await API({
    url: `/rfq${path}`,
    method: options.method || "GET",
    data: options.body ? JSON.parse(options.body) : undefined,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });

  console.log("✅ API Response:", res.data);

  return res.data;
};
