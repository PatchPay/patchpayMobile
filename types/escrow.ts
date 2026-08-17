export type EscrowStatus =
  | "pending"
  | "active"
  | "funded"
  | "released"
  | "cancelled"
  | "disputed"
  | string;

export interface Escrow {
  id: string;
  invoiceId?: string;
  rfqId?: string;
  amount: number;
  currency?: string;
  status: EscrowStatus;
  /** Seller who delivers the product/service. */
  creatorId?: string | number;
  /** Buyer who confirms receipt. */
  recipientId?: string | number;
  createdAt?: string;
  updatedAt?: string;
}
