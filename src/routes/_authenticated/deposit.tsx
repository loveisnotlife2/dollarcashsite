import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useState } from "react";
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

/*
 * PAYMENT ACCOUNTS
 * These are displayed directly on the Deposit page.
 * They are NOT loaded from the database.
 */
const PAYMENT_ACCOUNTS = {
  easypaisa: {
    method: "EasyPaisa",
    number: "03151390564",
    title: "Quratulain",
  },

  jazzcash: {
    method: "JazzCash",
    number: "03133221347",
    title: "Nadeem Khan",
  },
};

export function DepositPage() {
  const [amount, setAmount] = useState("");

  const [method, setMethod] =
    useState<"easypaisa" | "jazzcash">("easypaisa");

  const [transactionId, setTransactionId] =
    useState("");

  const [senderAccount, setSenderAccount] =
    useState("");

  const [loading, setLoading] = useState(false);

  const account =
    PAYMENT_ACCOUNTS[method];

  async function copyAccountNumber() {
    try {
      await navigator.clipboard.writeText(
        account.number
      );

      toast.success(
        `${account.method} account number copied!`
      );
    } catch {
      toast.error(
        "Unable to copy account number."
      );
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
      toast.error(
        "Enter your sending account number."
      );
      return;
    }

    try {
      setLoading(true);

      /*
       * Existing backend deposit system.
       * DO NOT CHANGE.
       */
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
        console.error(
          "Deposit submission error:",
          error
        );

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
      console.error(error);

      toast.error(
        "Deposit submission failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell
      title="Deposit"
      subtitle="Send payment to the selected account"
    >
      <div className="mx-auto w-full max-w-xl">

        <form
          onSubmit={submitDeposit}
          className="surface-card space-y-5 rounded-2xl border border-border p-5 sm:p-6"
        >

          {/* HEADER */}
          <div>
            <h2 className="text-xl font-bold">
              Make Deposit
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Select your payment method and send the
              payment to the account shown below.
            </p>
          </div>

          {/* PAYMENT METHOD */}
          <div className="space-y-2">
            <Label htmlFor="payment-method">
              Payment Method
            </Label>

            <select
              id="payment-method"
              value={method}
              onChange={(e) =>
                setMethod(
                  e.target.value as
                    | "easypaisa"
                    | "jazzcash"
                )
              }
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="easypaisa">
                EasyPaisa
              </option>

              <option value="jazzcash">
                JazzCash
              </option>
            </select>
          </div>

          {/* PAYMENT ACCOUNT */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">

            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Payment Account
            </p>

            <p className="mt-1 text-lg font-bold">
              {account.method}
            </p>

            {/* ACCOUNT NUMBER */}
            <div className="mt-4 rounded-xl border border-border bg-background p-4">

              <p className="text-xs text-muted-foreground">
                Account Number
              </p>

              <div className="mt-1 flex items-center justify-between gap-3">

                <p className="break-all font-mono text-xl font-bold tracking-wide">
                  {account.number}
                </p>

                <button
                  type="button"
                  onClick={copyAccountNumber}
                  className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-muted"
                >
                  Copy
                </button>

              </div>
            </div>

            {/* ACCOUNT TITLE */}
            <div className="mt-3 rounded-xl border border-border bg-background p-4">

              <p className="text-xs text-muted-foreground">
                Account Title
              </p>

              <p className="mt-1 text-base font-bold">
                {account.title}
              </p>

            </div>

            {/* INSTRUCTION */}
            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              Please send your payment to the account
              shown above and then enter your transaction
              details below.
            </p>

          </div>

          {/* AMOUNT */}
          <div className="space-y-2">
            <Label htmlFor="deposit-amount">
              Amount
            </Label>

            <Input
              id="deposit-amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value)
              }
              placeholder="Enter amount"
              required
            />
          </div>

          {/* TRANSACTION ID */}
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

          {/* SENDING ACCOUNT */}
          <div className="space-y-2">
            <Label htmlFor="sender-account">
              Your Sending Account Number
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

          {/* SUBMIT */}
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
