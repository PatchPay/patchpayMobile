import { useState, useCallback } from "react";

import { Alert } from "react-native";

import { Quote } from "../types/rfq.types";

import { apiFetch } from "@/api/rfqapi";

export function useRFQ() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);

  const fetchQuotes = useCallback(async () => {
    setLoadingQuotes(true);

    try {
      const data = await apiFetch("/quotes");

      setQuotes(data.data ?? []);
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message || e.message);
    } finally {
      setLoadingQuotes(false);
    }
  }, []);

  return {
    quotes,
    loadingQuotes,
    fetchQuotes,
  };
}
