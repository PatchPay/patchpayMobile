import API from "@/api/axiosInstance";
import { useEffect, useState } from "react";

export type Beneficiary = {
  id: string;
  name: string;
  accountNumber: string;
  bankName: string;
  bankCode?: string;
};

export function useBeneficiaries() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await API.get("/beneficiaries");
        setBeneficiaries(res.data?.data || []);
      } catch {
        setBeneficiaries([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return { beneficiaries, loading };
}
