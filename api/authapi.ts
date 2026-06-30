import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import API from "./axiosInstance";

type JwtPayload = {
  id?: string;
  userId?: string;
  _id?: string;
};

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
  const token =
    (await AsyncStorage.getItem("token")) ||
    (await AsyncStorage.getItem("authToken"));

  if (!token) return null;

  const decoded = jwtDecode<JwtPayload>(token);

  console.log("Decoded JWT:", decoded);

  return decoded.userId || decoded.id || decoded._id || null;
};
