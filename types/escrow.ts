export type EscrowStatus =
  | "pending"
  | "active"
  | "funded"
  | "released"
  | "cancelled"
  | "disputed"
  | string;

export interface Escrow {
  _id: string;
  invoiceId?: string;
  rfqId?: string;
  amount: number;
  currency?: string;
  status: EscrowStatus;
  createdAt?: string;
  updatedAt?: string;
}
