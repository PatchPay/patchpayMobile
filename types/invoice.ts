import { Escrow } from "./escrow";

export type InvoiceStatus =
  | "Pending"
  | "Accepted"
  | "Rejected"
  | "Cancelled"
  | "Paid";

export type InvoicePaymentStatus = "unpaid" | "pending" | "paid" | "failed";

export interface InvoiceUser {
  id: string;
  firstName: string;
  email: string;
  phoneNumber: string;
}

export interface DeliveryAddress {
  id: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  phoneNumber: string;
}

/**
 * 🔥 NEW: RFQ metadata / derived invoice info
 */
export interface InvoiceMetadata {
  quoteNumber?: string;
  productQuantity?: number;
}

/**
 * 🔥 NEW: RFQ reference (your backend nested object)
 */
export interface RFQ {
  arrival_date: any;
  arrival_time: string;
  id: string;

  amount: number;
  currency: string;

  quote_number: string;
  uprn: string;

  product_description: string;
  product_quantity: number;

  subtotal: number;
  line_total: number;
  total: number;

  transaction_charges: number;
  delivery_charge: number;
  exchange_rate: number;

  delivery_code?: number;
  delivery_type: string;
  trade_type: string;

  status: string;

  user: InvoiceUser;
  destinatary_user: InvoiceUser;

  delivery_address?: DeliveryAddress;

  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  inv: any;
  id: string;

  amount: number;
  currency: string;

  status: string;
  paymentStatus?: InvoicePaymentStatus;
  /** Seller; retained by the backend under this legacy field name. */
  requesterId?: string | number | InvoiceUser;
  /** Buyer and only party allowed to initiate payment. */
  recipientId?: string | number | InvoiceUser;

  description: string;

  /**
   * 🔥 FIX: metadata now properly typed
   */
  metadata?: InvoiceMetadata;

  /**
   * 🔥 FIX: full RFQ object included
   */
  rfqId?: RFQ;

  invoice?: string;

  escrowId?: Escrow;

  createdAt: string;
  updatedAt: string;
}

export interface InitiateInvoicePaymentResponse {
  success: boolean;
  paymentUrl: string;
  reference: string;
}

export interface VerifyInvoicePaymentResponse {
  success: boolean;
  data: {
    invoice: Invoice;
    escrow?: Escrow;
    transactions?: unknown[];
  };
}
