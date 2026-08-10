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

export const LogoutUser = async () => {
  try {
    const token = await AsyncStorage.getItem("token");

    // Notify backend that the user is logging out
    await API.post(
      "/users/logout",
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    // Clear local authentication data
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");

    return true;
  } catch (error) {
    console.error("Logout API error:", error);

    // Still clear local auth data even if the API request fails
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");

    return true;
  }
};

export const updateUser = async (data: {
  firstName?: string;
  middleName?: string;
  surname?: string;
  address?: any;
  phoneNumber?: string;
  country?: string;
  countryCode?: string;
  state?: string;
  continent?: string;
}) => {
  const res = await API.put("/users/profile", data, {
    headers: {
      Authorization: `Bearer ${await AsyncStorage.getItem("token")}`,
    },
  });

  return res.data;
};
