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
