import API from "./axiosInstance";

// ✅ GET all cards
export const getCards = async () => {
  const res = await API.get("/cards/card-details");
  return res.data;
};

// ✅ CREATE card
export const createCard = async (payload: any) => {
  const res = await API.post("/cards/card-details", payload);
  return res.data;
};

// ✅ UPDATE card
export const updateCard = async (id: string, payload: any) => {
  const res = await API.put(`/cards/card-details/${id}`, payload);
  return res.data;
};

// ✅ DELETE card
export const deleteCard = async (id: string) => {
  const res = await API.delete(`/cards/card-details/${id}`);
  return res.data;
};
