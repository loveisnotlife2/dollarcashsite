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
});

export function DepositPage() {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("easypaisa");
  const [transactionId, setTransactionId] =
    useState("");
  const [senderAccount, setSenderAccount] =
    useState("");

  const [easypaisaNo, setEasypaisaNo] =
    useState("03133221347");
  const [jazzcashNo, setJazzcashNo] =
    useState("03133221347");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void loadSettings();
  }, []);

  async function loadSettings() {
    const { data, error } = await supabase
      .from("payment_methods")
      .select("method,account_number,is_active");

    if (error) {
      console.error(error);
      return;
    }

    for (const row of data ?? []) {
      const name = String(row.method).toLowerCase();
      if (name === "easypaisa") setEasypaisaNo(row.account_number);
      if (name === "jazzcash") setJazzcashNo(row.account_number);
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

      const { error } = await supabase.rpc("submit_deposit", {
        p_usd: numericAmount,
        p_method: method === "easypaisa" ? "EasyPaisa" : "JazzCash",
        p_tid: `${transactionId.trim()} (from ${senderAccount.trim()})`,
        p_screenshot_url: "",
      });

      if (error) {
        console.error(error);
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
      toast.error("Deposit submission failed.");
    } finally {
      setLoading(false);
    }
  }

  const receivingAccount =
    method === "easypaisa"
      ? easypaisaNo
      : jazzcashNo;

  return (
    <AppShell title="Deposit">

      <div className="max-w-xl mx-auto">

        <form
          onSubmit={submitDeposit}
          className="surface-card border rounded-xl p-6 space-y-5"
        >

          <div>
            <h2 className="text-xl font-bold">
              Make Deposit
            </h2>

            <p className="text-sm text-muted-foreground mt-1">
              Send payment to the account below and submit
              your transaction details.
            </p>
          </div>

          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              Payment Account
            </p>

            <p className="font-bold text-lg">
              {receivingAccount}
            </p>

            <p className="text-sm mt-1">
              {method === "easypaisa"
                ? "EasyPaisa"
                : "JazzCash"}
            </p>
          </div>

          <div>
            <Label>Payment Method</Label>

            <select
              value={method}
              onChange={(e) =>
                setMethod(e.target.value)
              }
              className="w-full border rounded-md p-2 mt-1 bg-background"
            >
              <option value="easypaisa">
                EasyPaisa
              </option>

              <option value="jazzcash">
                JazzCash
              </option>
            </select>
          </div>

          <div>
            <Label>Amount</Label>

            <Input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value)
              }
              placeholder="Enter amount"
            />
          </div>

          <div>
            <Label>Transaction ID / TID</Label>

            <Input
              value={transactionId}
              onChange={(e) =>
                setTransactionId(e.target.value)
              }
              placeholder="Enter transaction ID"
            />
          </div>

          <div>
            <Label>Your Sending Account</Label>

            <Input
              value={senderAccount}
              onChange={(e) =>
                setSenderAccount(e.target.value)
              }
              placeholder="03XXXXXXXXX"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
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
