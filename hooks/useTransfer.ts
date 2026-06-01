import { useCallback, useState } from "react";
import API from "@/api/axiosInstance";

export type InternalTransferPayload = {
  accountNumber: string;

  amount: number;
  transactionPin: string;
  description?: string;
};

export type ExternalTransferPayload = InternalTransferPayload & {
  bankCode: string;
};

export type TransferType = "internal" | "external";

export type TransferPayload = InternalTransferPayload | ExternalTransferPayload;

export type TransferResponse = Record<string, unknown>;

// ✅ generate unique idempotency key per request
const generateIdempotencyKey = () => {
  return `tx_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
};

const getErrorMessage = (err: any) => {
  return (
    err?.response?.data?.message ||
    err?.message ||
    "Transfer failed. Please try again."
  );
};

export function useTransfer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<TransferResponse | null>(null);

  const transfer = useCallback(
    async (type: TransferType, payload: TransferPayload) => {
      try {
        setLoading(true);
        setError("");
        setSuccess(null);

        const endpoint =
          type === "internal"
            ? "/transfers/internal"
            : "/transfers/external-bank";

        // ✅ IMPORTANT: create idempotency key here
        const idempotencyKey = generateIdempotencyKey();

        console.log("================================");
        console.log("🚀 TRANSFER REQUEST");
        console.log("Type:", type);
        console.log("Endpoint:", endpoint);
        console.log("Idempotency-Key:", idempotencyKey);
        console.log("Payload:", payload);
        console.log("================================");

        const res = await API.post<TransferResponse>(endpoint, payload, {
          headers: {
            "Idempotency-Key": idempotencyKey,
          },
        });

        console.log("✅ TRANSFER SUCCESS:", res.data);

        setSuccess(res.data);
        return true;
      } catch (err: any) {
        console.log("❌ TRANSFER ERROR:", err?.response?.data || err);

        setError(getErrorMessage(err));
        return false;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    transfer,
    loading,
    error,
    success,
    setError,
  };
}
