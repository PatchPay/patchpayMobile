import { Quote } from "../types/rfq.types";

export const DELIVERY_TYPES = ["Standard", "Secure"];

export const TRADE_TYPES = ["Domestic", "International"];

export const STATUS_META: Record<
  Quote["status"],
  { color: string; bg: string }
> = {
  Pending: {
    color: "#f5a623",
    bg: "#fff8ec",
  },

  Accepted: {
    color: "#2ec4b6",
    bg: "#e8faf4",
  },

  Rejected: {
    color: "#e05c97",
    bg: "#fdf0f6",
  },

  Cancelled: {
    color: "#94a3b8",
    bg: "#f1f5f9",
  },
};
