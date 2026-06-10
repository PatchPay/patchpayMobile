export const DELIVERY_TYPES = ["Standard", "Secure"];

export const TRADE_TYPES = ["Domestic", "International"];

export const STATUS_META: Record<string, { color: string; bg: string }> = {
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
  pending: {
    color: "#f5a623",
    bg: "#fff8ec",
  },
  accepted: {
    color: "#2ec4b6",
    bg: "#e8faf4",
  },
  rejected: {
    color: "#e05c97",
    bg: "#fdf0f6",
  },
  cancelled: {
    color: "#94a3b8",
    bg: "#f1f5f9",
  },
};
