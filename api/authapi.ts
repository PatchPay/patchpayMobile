import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "./axiosInstance";

export const registerUser = async (data: any) => {
  const res = await API.post("/users/register", data);
  return res.data;
};

export const loginUser = async (data: any) => {
  const res = await API.post("/users/login", data);
  return res.data;
};

export const getUser = async () => {
  const res = await API.get("/users/profile", {
    headers: {
      Authorization: `Bearer ${await AsyncStorage.getItem("token")}`,
    },
  });
  return res.data;
};

export const getCurrentUserId = async () => {
  const user = await getUser();
  return user.id;
};

export const forgotPassword = async (email: string) => {
  const { data } = await API.post(`/users/forget-password`, { email });
  return data;
};

export const resetPassword = async (payload: {
  email: string;
  otp: string;
  password: string;
  confirmPassword: string;
}) => {
  const { data } = await API.post(`/users/reset-password`, payload);
  return data;
};
