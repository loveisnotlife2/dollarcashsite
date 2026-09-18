import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute(
  "/_authenticated/deposit"
)({
  component: DepositPage,
  head: () => ({
    meta: [{ title: "Deposit · DollarCash" }],
  }),
});

export function DepositPage() {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("easypaisa");

  const [transactionId, setTransactionId] =
    useState("");

  const [senderAccount, setSenderAccount] =
    useState("");

  // Correct default payment accounts
  const [easypaisaNo, setEasypaisaNo] =
    useState("03151390564");

  const [easypaisaTitle, setEasypaisaTitle] =
    useState("Quratulain");

  const [jazzcashNo, setJazzcashNo] =
    useState("03133221347");

  const [jazzcashTitle, setJazzcashTitle] =
    useState("Nadeem Khan");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void loadSettings();
  }, []);

  async function loadSettings() {
    const { data, error } = await supabase
      .from("payment_methods")
      .select(
        "method,account_number,account_title,is_active"
      );

    if (error) {
      console.error("Payment settings error:", error);
      return;
    }

    for (const row of data ?? []) {
      const name = String(row.method).toLowerCase();

      if (name === "easypaisa") {
        if (row.account_number) {
          setEasypaisaNo(row.account_number);
        }

        if (row.account_title) {
          setEasypaisaTitle(row.account_title);
        }
      }

      if (name === "jazzcash") {
        if (row.account_number) {
          setJazzcashNo(row.account_number);
        }

        if (row.account_title) {
          setJazzcashTitle(row.account_title);
        }
      }
    }
  }

  async function submitDeposit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }

    if (!transactionId.trim()) {
      toast.error("Enter transaction ID.");
      return;
    }

    if (!senderAccount.trim()) {
      toast.error("Enter your sending account.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.rpc(
        "submit_deposit",
        {
          p_usd: numericAmount,
          p_method:
            method === "easypaisa"
              ? "EasyPaisa"
              : "JazzCash",

          p_tid: `${transactionId.trim()} (from ${senderAccount.trim()})`,

          p_screenshot_url: "",
        }
      );

      if (error) {
        console.error("Deposit error:", error);
        toast.error(error.message);
        return;
      }

      toast.success(
        "Deposit submitted. Waiting for admin approval."
      );

      setAmount("");
      setTransactionId("");
      setSenderAccount("");
    } catch (error) {
      console.error("Deposit submission failed:", error);
      toast.error("Deposit submission failed.");
    } finally {
      setLoading(false);
    }
  }

  const isEasyPaisa = method === "easypaisa";

  const receivingAccount = isEasyPaisa
    ? easypaisaNo
    : jazzcashNo;

  const receivingTitle = isEasyPaisa
    ? easypaisaTitle
    : jazzcashTitle;

  const receivingMethod = isEasyPaisa
    ? "EasyPaisa"
    : "JazzCash";

  return (
    <AppShell
      title="Deposit"
      subtitle="Add funds to your DollarCash account"
    >
      <div className="mx-auto w-full max-w-xl">

        <form
          onSubmit={submitDeposit}
          className="surface-card space-y-5 rounded-2xl border border-border p-5 sm:p-6"
        >

          {/* Header */}
          <div>
            <h2 className="text-xl font-bold">
              Make Deposit
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Select a payment method, send the payment,
              then enter your transaction details.
            </p>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="payment-method">
              Payment Method
            </Label>

            <select
              id="payment-method"
              value={method}
              onChange={(e) =>
                setMethod(e.target.value)
              }
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-emerald-500"
            >
              <option value="easypaisa">
                EasyPaisa
              </option>

              <option value="jazzcash">
                JazzCash
              </option>
            </select>
          </div>

          {/* Selected Payment Account */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 sm:p-5">

            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Payment Account
            </p>

            <p className="mt-1 text-lg font-bold">
              {receivingMethod}
            </p>

            {/* Account Number */}
            <div className="mt-4 rounded-xl border border-border bg-background p-4">
              <p className="text-xs text-muted-foreground">
                Account Number
              </p>

              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="break-all font-mono text-lg font-bold">
                  {receivingAccount}
                </p>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        receivingAccount
                      );

                      toast.success(
                        "Account number copied!"
                      );
                    } catch {
                      toast.error(
                        "Could not copy account number."
                      );
                    }
                  }}
                  className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs font-semibold transition hover:bg-muted"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Account Title */}
            <div className="mt-3 rounded-xl border border-border bg-background p-4">
              <p className="text-xs text-muted-foreground">
                Account Title
              </p>

              <p className="mt-1 font-semibold">
                {receivingTitle}
              </p>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Send your payment to the account above.
              After payment, enter the transaction details
              below.
            </p>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="deposit-amount">
              Amount
            </Label>

            <Input
              id="deposit-amount"
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value)
              }
              placeholder="Enter amount"
              required
            />
          </div>

          {/* Transaction ID */}
          <div className="space-y-2">
            <Label htmlFor="transaction-id">
              Transaction ID / TID
            </Label>

            <Input
              id="transaction-id"
              type="text"
              value={transactionId}
              onChange={(e) =>
                setTransactionId(e.target.value)
              }
              placeholder="Enter transaction ID"
              required
            />
          </div>

          {/* Sender Account */}
          <div className="space-y-2">
            <Label htmlFor="sender-account">
              Your Sending Account
            </Label>

            <Input
              id="sender-account"
              type="text"
              inputMode="numeric"
              value={senderAccount}
              onChange={(e) =>
                setSenderAccount(e.target.value)
              }
              placeholder="03XXXXXXXXX"
              required
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl font-semibold"
          >
            {loading
              ? "Submitting..."
              : "Submit Deposit"}
          </Button>

        </form>
      </div>
    </AppShell>
  );
}
