import api from "./axiosInstance";

type TransferDirection = "account_to_wallet" | "wallet_to_account";

type TransferResponse = {
  success: boolean;
  message: string;
  data: {
    accountBalance: number;
    walletBalance: number;
    currency: string;
    replayed: boolean;
    transaction: {
      reference: string;
      amount: number;
      type: string;
      status: string;
    };
  };
};

export const balanceTransferService = {
  async transfer(params: {
    amount: number;
    pin: string;
    direction: TransferDirection;
  }): Promise<TransferResponse> {
    const endpoint =
      params.direction === "account_to_wallet"
        ? "/wallet/account-to-wallet"
        : "/wallet/wallet-to-account";

    const idempotencyKey = `${params.direction}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;

    const response = await api.post<TransferResponse>(
      endpoint,
      {
        amount: params.amount,
        transactionPin: params.pin,
        idempotencyKey,
      },
      {
        headers: {
          "Idempotency-Key": idempotencyKey,
        },
      },
    );

    return response.data;
  },
};
