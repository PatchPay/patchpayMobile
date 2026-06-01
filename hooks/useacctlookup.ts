import { useCallback, useState } from "react";
import API from "@/api/axiosInstance";

export type AccountLookupPayload = {
  accountNumber: string;
  bankCode?: string;
};

export type AccountLookupResponse = Record<string, unknown>;

const getErrorMessage = (err: unknown) => {
  if (
    typeof err === "object" &&
    err !== null &&
    "response" in err &&
    typeof err.response === "object" &&
    err.response !== null &&
    "data" in err.response &&
    typeof err.response.data === "object" &&
    err.response.data !== null &&
    "message" in err.response.data &&
    typeof err.response.data.message === "string"
  ) {
    return err.response.data.message;
  }

  if (err instanceof Error) {
    return err.message;
  }

  return "Account lookup failed. Please try again.";
};

export function useAccountLookup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [accountInfo, setAccountInfo] = useState<AccountLookupResponse | null>(
    null,
  );

  const lookupAccount = useCallback(async (payload: AccountLookupPayload) => {
    try {
      setLoading(true);
      setError("");
      setAccountInfo(null);

      const res = await API.post<AccountLookupResponse>(
        "/transfers/account-lookup",
        payload,
      );

      setAccountInfo(res.data);
      return res.data;
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    lookupAccount,
    loading,
    error,
    accountInfo,
    setError,
  };
}
