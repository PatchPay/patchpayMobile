import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "./axiosInstance";

export const getWallet = async () => {
  const res = await API.get("/wallet/details", {
    headers: {
      Authorization: `Bearer ${await AsyncStorage.getItem("token")}`,
    },
  });
  return res.data;
};

export const getUserTransactions = async (userId: string) => {
  try {
    const token = await AsyncStorage.getItem("token");

    const res = await API.get(`/transactions/user/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data;
  } catch (error: any) {
    console.log(
      "❌ ERROR fetching user transactions:",
      error?.response || error,
    );
    throw error;
  }
};
