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

export interface Quote {
  _id: string;
  quote_number: string;
  type: string;
  product_description: string;
  product_quantity: number;
  amount: number;
  currency: string;
  total: number;
  status: "Pending" | "Accepted" | "Rejected" | "Cancelled";
  delivery_type: string;
  trade_type: string;
  createdAt: string;

  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };

  destinatary_user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}
