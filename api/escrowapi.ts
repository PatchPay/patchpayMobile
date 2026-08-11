import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCurrentUserId } from "./authapi";
import API from "./axiosInstance";

export const getAuthToken = async (): Promise<string> => {
  const token =
    (await AsyncStorage.getItem("token")) ||
    (await AsyncStorage.getItem("authToken"));

  return token || "";
};

// helper: creatorId/recipientId may come back as a raw id string, or as a
// populated object ({ _id, id, firstName, ... }) depending on the endpoint
// const idOf = (value: any): string | undefined =>
//   typeof value === "string" ? value : value?._id || value?.id;

// GET /escrow/my-escrow — escrows where the current user is creator or recipient
export const getMyEscrow = async () => {
  const userId = await getCurrentUserId();

  const { data } = await API.get("/escrow/my-escrow");

  const escrows = (data.data || []).filter((item: any) => {
    return (
      String(item.creatorId) === String(userId) ||
      String(item.recipientId) === String(userId)
    );
  });

  return escrows.map((item: any) => ({
    ...item,
    role: String(item.creatorId) === String(userId) ? "buyer" : "seller",
  }));
};

// GET /escrow — all escrows visible to the current user
export const getAllEscrow = async () => {
  const { data } = await API.get("/escrow/");
  return data.data;
};

// GET /escrow/:id — a single escrow by id
export const getEscrowById = async (id: string) => {
  const { data } = await API.get(`/escrow/${id}`);
  return data.data;
};

// POST /escrow — create a new escrow
export const createEscrow = async (payload: any) => {
  const { data } = await API.post("/escrow", payload);
  return data.data;
};

// POST /escrow/:id/fund
export const fundEscrow = async (id: string, payload?: any) => {
  const { data } = await API.post(`/escrow/${id}/fund`, payload);
  return data.data;
};

// POST /escrow/:id/release — confirm delivery, release funds to the recipient
export const releaseEscrow = async (id: string) => {
  const { data } = await API.post(`/escrow/${id}/release`);
  return data.data;
};

// POST /escrow/:id/refund
export const refundEscrow = async (id: string) => {
  const { data } = await API.post(`/escrow/${id}/refund`);
  return data.data;
};

// POST /escrow/:id/dispute
export const disputeEscrow = async (id: string, reason?: string) => {
  const { data } = await API.post(`/escrow/${id}/dispute`, { reason });
  return data.data;
};

// POST /escrow/:id/cancel
export const cancelEscrow = async (id: string) => {
  const { data } = await API.post(`/escrow/${id}/cancel`);
  return data.data;
};

// POST /escrow/:id/deliver — seller submits delivery-proof image (multipart)

export const markEscrowDelivered = async (
  id: string,
  image: { uri: string; name?: string; type?: string },
) => {
  const formData = new FormData();

  // Must match backend:
  // upload.single("deliveryProof")
  formData.append("deliveryProof", {
    uri: image.uri,
    name: image.name || `delivery-proof-${Date.now()}.jpg`,
    type: image.type || "image/jpeg",
  } as any);

  const { data } = await API.post(`/escrow/${id}/deliver`, formData);

  return data.data;
};
