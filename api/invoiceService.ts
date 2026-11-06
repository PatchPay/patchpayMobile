import {
  InitiateInvoicePaymentResponse,
  Invoice,
  VerifyInvoicePaymentResponse,
} from "@/types/invoice";
import API from "./axiosInstance";
import { unwrapData } from "./response";

export const invoiceService = {
  async generateInvoice(quoteId: string): Promise<Invoice> {
    const res = await API.post(`/invoices/generate-invoice/${quoteId}`);

    console.log("Invoice response:", res.data);

    return unwrapData<Invoice>(res.data);
  },

  async getInvoice(invoiceId: string): Promise<Invoice> {
    const res = await API.get(`/invoices/${invoiceId}`);

    return unwrapData<Invoice>(res.data);
  },

  async initiatePayment(
    invoiceId: string,
    transactionPin: string,
  ): Promise<InitiateInvoicePaymentResponse> {
    const res = await API.post(`/invoices/${invoiceId}/initiate-payment`, {
      transactionPin,
    });

    console.log("Initiate payment response:", res.data);

    return res.data;
  },

  async verifyPayment(
    transactionRef: string,
  ): Promise<VerifyInvoicePaymentResponse> {
    const res = await API.post("/invoices/verify-payment", {
      transactionRef,
    });

    console.log("Verify payment response:", res.data);

    return res.data;
  },
};
