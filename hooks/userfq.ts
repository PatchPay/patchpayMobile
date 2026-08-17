import { useState, useCallback } from "react";

import { Quote } from "../types/rfq.types";

import { rfqService } from "@/api/rfqService";

export function useRFQ() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [quotesError, setQuotesError] = useState<string | null>(null);
  const [receivedQuotes, setReceivedQuotes] = useState<Quote[]>([]);
  const [loadingReceivedQuotes, setLoadingReceivedQuotes] = useState(false);
  const [receivedQuotesError, setReceivedQuotesError] = useState<string | null>(null);

  const fetchQuotes = useCallback(async () => {
    setLoadingQuotes(true);
    setQuotesError(null);

    try {
      const data = await rfqService.getQuotes();
      setQuotes(data);
    } catch (e: any) {
      setQuotesError(e?.response?.data?.message || e.message);
    } finally {
      setLoadingQuotes(false);
    }
  }, []);

  const fetchReceivedQuotes = useCallback(async () => {
    setLoadingReceivedQuotes(true);
    setReceivedQuotesError(null);
    try {
      setReceivedQuotes(await rfqService.getReceivedRFQs());
    } catch (e: any) {
      setReceivedQuotesError(e?.response?.data?.message || e.message);
    } finally {
      setLoadingReceivedQuotes(false);
    }
  }, []);

  return {
    quotes,
    loadingQuotes,
    quotesError,
    fetchQuotes,
    receivedQuotes,
    loadingReceivedQuotes,
    receivedQuotesError,
    fetchReceivedQuotes,
  };
}
