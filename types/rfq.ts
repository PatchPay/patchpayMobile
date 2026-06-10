export type SearchType = "email" | "phone" | "name";

export interface FoundUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  currency: string;
  country: string;
  uniqueId: string;
}

export type QuoteStatus =
  | "Pending"
  | "Accepted"
  | "Rejected"
  | "Cancelled"
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled";

export interface QuoteUser {
  _id: string;
  firstName: string;
  lastName?: string;
  surname?: string;
  email: string;
}

export interface Quote {
  _id: string;
  quote_number?: string;
  type?: string;
  product_description: string;
  product_quantity: number;
  amount: number;
  currency: string;
  total?: number;
  total_amount?: number;
  status: QuoteStatus;
  delivery_type?: string;
  trade_type?: string;
  createdAt: string;
  invoiceId?: string;
  invoice_id?: string;
  invoiceID?: string;
  invoice?:
    | string
    | {
        _id?: string;
        id?: string;
      };
  user: QuoteUser;
  requester?: QuoteUser;
  requesterId?: QuoteUser | string;
  destinatary_user: QuoteUser;
  recipient?: QuoteUser;
  recipientId?: QuoteUser | string;
}

export interface CreateRFQPayload {
  recipientId: string;
  product_description: string;
  product_quantity: number;
  amount: number;
  delivery_type: string;
  trade_type: string;
  delivery_address: {
    street: string;
    city: string;
    state: string;
    country: string;
    phoneNumber: string;
    postal_code: string;
  };
  currency: string;
  line_total: number;
  delivery_charge: number;
  transaction_charges: number;
  subtotal: number;
  total_amount: number;
}
