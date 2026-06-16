import API from "./axiosInstance";
import { unwrapData } from "./response";
import {
  InitiateInvoicePaymentResponse,
  Invoice,
  VerifyInvoicePaymentResponse,
} from "@/types/invoice";

export const invoiceService = {
  async generateInvoice(quoteId: string): Promise<Invoice> {
    const res = await API.post(`/invoices/generate-invoice/${quoteId}`);
    console.log("check the response for the invoice", res.data);
    return unwrapData<Invoice>(res.data);
  },

  async getInvoice(invoiceId: string): Promise<Invoice> {
    const res = await API.get(`/invoices/${invoiceId}`);
    return unwrapData<Invoice>(res.data);
  },

  async initiatePayment(
    invoiceId: string,
  ): Promise<InitiateInvoicePaymentResponse> {
    const res = await API.post(`/invoices/${invoiceId}/initiate-payment`);
    return unwrapData<InitiateInvoicePaymentResponse>(res.data);
  },

  async verifyPayment(
    transactionRef: string,
  ): Promise<VerifyInvoicePaymentResponse> {
    try {
      const res = await API.post("/invoices/verify-payment", {
        transactionRef,
      });

      return res.data;
    } catch (error: any) {
      console.log("Verify Payment Error:", error);

      console.log("Error Message:", error?.message);

      console.log("Backend Response:", error?.response?.data);

      console.log("Backend Message:", error?.response?.data?.message);

      throw error; // re-throw so your UI catch block still works
    }
  },
};
