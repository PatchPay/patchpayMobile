import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCurrentUserId } from "./authapi";
import API from "./axiosInstance";

export type DeliveryProofImage = {
  uri: string;
  name?: string;
  type?: string;
};

const MIME_TYPES_BY_EXTENSION: Record<string, string> = {
  jpeg: "image/jpeg",
  jpg: "image/jpg",
  png: "image/png",
  webp: "image/webp",
};

const EXTENSIONS_BY_MIME_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const normalizeMimeType = (type?: string, uri?: string) => {
  const normalizedType = type?.trim().toLowerCase();
  const mimeTypeAliases: Record<string, string> = {
    "image/jpe": "image/jpeg",
    "image/pjpeg": "image/jpeg",
    "image/x-png": "image/png",
  };

  if (normalizedType && EXTENSIONS_BY_MIME_TYPE[normalizedType]) {
    return normalizedType;
  }

  if (normalizedType && mimeTypeAliases[normalizedType]) {
    return mimeTypeAliases[normalizedType];
  }

  if (normalizedType) {
    throw new Error("Delivery proof must be a JPG, PNG, or WEBP image");
  }

  const extension = uri
    ?.split(/[?#]/, 1)[0]
    .match(/\.([a-z0-9]+)$/i)?.[1]
    ?.toLowerCase();

  if (extension && MIME_TYPES_BY_EXTENSION[extension]) {
    return MIME_TYPES_BY_EXTENSION[extension];
  }

  if (extension) {
    throw new Error("Delivery proof must be a JPG, PNG, or WEBP image");
  }

  return "image/jpeg";
};

export const normalizeDeliveryProofImage = (
  image: DeliveryProofImage,
): Required<DeliveryProofImage> => {
  if (!image?.uri || /^https?:\/\//i.test(image.uri)) {
    throw new Error("A local delivery-proof image is required");
  }

  const type = normalizeMimeType(image.type, image.name || image.uri);
  const extension = EXTENSIONS_BY_MIME_TYPE[type];

  if (!extension) {
    throw new Error("Delivery proof must be a JPG, PNG, or WEBP image");
  }

  const suppliedName = image.name?.trim();
  const baseName =
    suppliedName?.replace(/\.[^.]+$/, "") || `delivery-proof-${Date.now()}`;

  return {
    uri: image.uri,
    name: `${baseName}.${extension}`,
    type,
  };
};

export const getDeliveryProofUrl = (url?: string | null) => {
  if (!url || /^https?:\/\//i.test(url)) {
    return url || null;
  }

  const origin = (API.defaults.baseURL || "")
    .replace(/\/api\/?$/i, "")
    .replace(/\/+$/, "");

  return `${origin}/${url.replace(/^\/+/, "")}`;
};

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
    role: String(item.creatorId) === String(userId) ? "seller" : "buyer",
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
  image: DeliveryProofImage,
) => {
  const normalizedImage = normalizeDeliveryProofImage(image);

  const formData = new FormData();

  formData.append("deliveryProof", {
    uri: normalizedImage.uri,
    name: normalizedImage.name,
    type: normalizedImage.type,
  } as any);

  console.log("========== DELIVERY START ==========");

  console.log("API BASE URL:", API.defaults.baseURL);
  console.log("ESCROW ID:", id);

  console.log("IMAGE:", {
    uri: normalizedImage.uri,
    name: normalizedImage.name,
    type: normalizedImage.type,
  });

  try {
    const { data } = await API.post(`/escrow/${id}/deliver`, formData, {
      timeout: 60000,
      headers: {
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
      },
      transformRequest: [(data) => data],
    });

    console.log("✅ DELIVERY SUCCESS:", data);

    return data.data;
  } catch (error: any) {
    console.log("========== DELIVERY ERROR ==========");

    console.log("message:", error?.message);
    console.log("code:", error?.code);
    console.log("status:", error?.response?.status);
    console.log("response:", error?.response?.data);

    throw error;
  }
};

export const confirmEscrowReceipt = async (id: string) => {
  const { data } = await API.post(`/escrow/${id}/confirm-receipt`);

  return data.data;
};
