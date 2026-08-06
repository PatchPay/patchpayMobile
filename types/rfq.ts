export type SearchType = "email" | "phone" | "name";

export interface FoundUser {
  id: string;
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
  id: string;
  firstName: string;
  lastName?: string;
  surname?: string;
  email: string;
}

export interface Quote {
  id: number;

  quote_number: string;
  type: "RFQ" | "Invoice";

  product_description: string;
  product_quantity: number;

  amount: number;
  currency: string;
  total: number;

  uprn: string;
  status: string;

  user_data: {
    id: number;
    firstName: string;
    surname: string;
    phoneNumber: string;
  };

  destinatary_user: {
    id: number;
    firstName: string;
    surname: string;
    phoneNumber: string;
  };

  delivery_code: number;
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

  arrival_date: string;
  arrival_time: string;

  line_total: number;
  delivery_charge: number;
  transaction_charges: number;
  subtotal: number;

  proof_delivery: number;
  coupon: any[];

  exchange_rate: number;

  responseNotificationDue: string;
  notificationSent: boolean;
  deletionNotificationSent: boolean;

  invoice: any | null;

  createdAt: string;
  updatedAt: string;
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
  arrival_date: string;
  arrival_time: string;
}
