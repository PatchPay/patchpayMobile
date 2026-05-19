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

export const setTransactionPin = async (
  transactionPin: string,
  confirmTransactionPin: string,
) => {
  try {
    const token = await AsyncStorage.getItem("token");

    const res = await API.post(
      "/users/transaction-pin",
      {
        transactionPin,
        confirmTransactionPin,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return res.data;
  } catch (error: any) {
    console.log("❌ ERROR setting transaction pin:", error?.response || error);
    throw error;
  }
};

// ── Auth ─────────────────────────────────────────────────────────────────────

const getAuthHeaders = async () => {
  const token =
    (await AsyncStorage.getItem("token")) ||
    (await AsyncStorage.getItem("authToken"));
  return { Authorization: `Bearer ${token ?? ""}` };
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ResolveAccountResponse {
  success: boolean;
  message?: string;
  data?: { accountName: string; accountNumber: string; verified: boolean };
}

export interface WithdrawalPayload {
  amount: number;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  transactionPin: string;
  description?: string;
  idempotencyKey: string;
}

export interface WithdrawalResponse {
  success: boolean;
  message?: string;
  data?: {
    transaction?: { reference?: string };
    withdrawal?: { status?: string };
  };
}

// ── API calls ─────────────────────────────────────────────────────────────────

/**
 * POST /payments/withdrawal/resolve-account
 * Looks up the account name for a given bank + account number.
 */
export const resolveAccount = async (
  accountNumber: string,
  bankCode: string,
): Promise<ResolveAccountResponse> => {
  const headers = await getAuthHeaders();

  try {
    const res = await API.post(
      "/payments/withdrawal/resolve-account",
      {
        bank_code: bankCode,
        account_number: accountNumber,
      },
      { headers },
    );

    return res.data;
  } catch (error: any) {
    // 🔥 extract backend message safely
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Unable to resolve account";

    // throw a clean error so UI can display it
    throw new Error(message);
  }
};

/**
 * POST /payments/withdrawal/initiate
 * Initiates the actual withdrawal. Uses an idempotency key to prevent
 * duplicate debits on retries.
 */
export const initiateWithdrawal = async (
  payload: WithdrawalPayload,
): Promise<WithdrawalResponse> => {
  try {
    const headers = await getAuthHeaders();

    const res = await API.post(
      `/payments/withdrawal/initiate`,
      {
        amount: payload.amount,
        bankCode: payload.bankCode,
        accountNumber: payload.accountNumber,
        accountName: payload.accountName,
        transactionPin: payload.transactionPin,
        description: payload.description,
      },
      {
        headers: {
          ...headers,
          "x-idempotency-key": payload.idempotencyKey,
        },
      },
    );

    console.log("✅ Withdrawal Response:", res.data);

    return res.data;
  } catch (error: any) {
    console.log("❌ FULL ERROR:", error);

    console.log("❌ ERROR RESPONSE:", error?.response);

    console.log("❌ ERROR RESPONSE DATA:", error?.response?.data);

    console.log("❌ ERROR MESSAGE:", error?.message);

    throw error;
  }
};
