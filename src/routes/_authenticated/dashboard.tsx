  // DEFAULT_TRANSACTIONS ko khali rakhein
  const DEFAULT_TRANSACTIONS: TransactionRequest[] = [];

  // Storage key update (dc_transactions_v2) taake purana storage override ho jaye
  const STORAGE_KEY = "dc_transactions_v2";

  const [transactions, setTransactions] = useState<TransactionRequest[]>(() => {
    if (typeof window !== "undefined") {
      // Clear legacy storage automatically if it exists
      localStorage.removeItem("dc_transactions");

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse transactions", e);
        }
      }
    }
    return DEFAULT_TRANSACTIONS;
  });

  // Save updated transactions to new storage key
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    }
  }, [transactions]);
