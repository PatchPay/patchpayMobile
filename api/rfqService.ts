import { CreateRFQPayload, Quote } from "@/types/rfq";
import API from "./axiosInstance";
import { unwrapData } from "./response";

export interface QuoteActionResponse {
  quote?: Quote;
  rfq?: Quote;
  data?: {
    quote?: Quote;
    rfq?: Quote;
  };
}

export const rfqService = {
  async createRFQ(payload: CreateRFQPayload) {
    const res = await API.post("/rfq/create", payload);
    console.log("this the response frome the create rfq", res.data);
    return res.data;
  },

  async getQuotes(): Promise<Quote[]> {
    const res = await API.get("/rfq/quotes");
    const data = unwrapData<Quote[]>(res.data);
    console.log("this quotes", data);
    return Array.isArray(data) ? data : [];
  },

  /** RFQs addressed to the authenticated buyer. */
  async getReceivedRFQs(): Promise<Quote[]> {
    const res = await API.get("/rfq/quotes/received");
    const data = unwrapData<Quote[]>(res.data);
    return Array.isArray(data) ? data : [];
  },

  async getQuote(quoteId: string): Promise<Quote> {
    const res = await API.get(`/rfq/quotes/${quoteId}`);
    console.log("this the response frome the quotes", res.data);
    return unwrapData<Quote>(res.data);
  },

  async updateQuote(quoteId: string, payload: Partial<CreateRFQPayload>) {
    const res = await API.put(`/rfq/quotes/${quoteId}`, payload);
    return res.data;
  },

  async acceptQuote(quoteId: string): Promise<QuoteActionResponse> {
    const res = await API.put(`/rfq/quotes/${quoteId}/accept`);

    return res.data;
  },

  async rejectQuote(quoteId: string, reason = "") {
    const res = await API.put(`/rfq/quotes/${quoteId}/reject`, { reason });
    return res.data;
  },

  async cancelQuote(quoteId: string) {
    const res = await API.put(`/rfq/quotes/${quoteId}/cancel`);
    return res.data;
  },
  async generateInvoice(quoteId: string) {
    const res = await API.post(`/invoices/generate-invoice/${quoteId}`);
    return res.data;
  },
  async deleteQuote(quoteId: string) {
    const res = await API.delete(`/rfq/quotes/${quoteId}`);
    return res.data;
  },
};
