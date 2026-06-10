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
    const res = await API.post("/invoices/verify-payment", { transactionRef });
    return res.data;
  },
};
