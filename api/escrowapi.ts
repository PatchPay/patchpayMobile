import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCurrentUserId } from "./authapi";
import API from "./axiosInstance";

export const getAuthToken = async (): Promise<string> => {
  const token =
    (await AsyncStorage.getItem("token")) ||
    (await AsyncStorage.getItem("authToken"));

  return token || "";
};

export const getMyEscrow = async () => {
  const userId = await getCurrentUserId();

  const { data } = await API.get("/escrow/my-escrow");

  console.log(data);

  const escrows = data.data.filter((item: any) => {
    return item.creatorId?._id === userId || item.recipientId?._id === userId;
  });

  return escrows.map((item: any) => ({
    ...item,
    role: item.creatorId?._id === userId ? "creator" : "recipient",
  }));
};
