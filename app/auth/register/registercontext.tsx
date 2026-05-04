import { createContext, useContext, useState } from "react";

export type AccountType = "personal" | "merchant" | "";

export type RegisterData = {
  type: AccountType;
  email: string;
  password: string;

  // Personal
  firstName: string;
  middleName: string;
  surname: string;
  phone: string;
  country: string;
  countryCode: string;

  // Merchant
  businessName: string;
  industry: string;
  companyAddress: string;
  companyRegistrationNumber: string;
};

type RegisterContextType = {
  formData: RegisterData;
  updateField: <K extends keyof RegisterData>(
    key: K,
    value: RegisterData[K],
  ) => void;
  resetForm: () => void;
};

const defaultData: RegisterData = {
  type: "",
  email: "",
  password: "",
  firstName: "",
  middleName: "",
  surname: "",
  phone: "",
  country: "",
  countryCode: "",
  businessName: "",
  industry: "",
  companyAddress: "",
  companyRegistrationNumber: "",
};

const RegisterContext = createContext<RegisterContextType | null>(null);

export const RegisterProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [formData, setFormData] = useState<RegisterData>(defaultData);

  const updateField = <K extends keyof RegisterData>(
    key: K,
    value: RegisterData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => setFormData(defaultData);

  return (
    <RegisterContext.Provider value={{ formData, updateField, resetForm }}>
      {children}
    </RegisterContext.Provider>
  );
};

export const useRegister = (): RegisterContextType => {
  const ctx = useContext(RegisterContext);
  if (!ctx) throw new Error("useRegister must be used within RegisterProvider");
  return ctx;
};
