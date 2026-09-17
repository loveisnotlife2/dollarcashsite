import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardComponent,
});

function DashboardComponent() {
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  const easyPaisaNumber = "03151390564";
  const referLink = `${window.location.origin}/register?ref=user123`;

  const handleCopy = (text: string, type: "account" | "ref") => {
    navigator.clipboard.writeText(text);
    if (type === "account") {
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    } else {
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>

      {/* Top Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="p-5 border border-slate-800 rounded-xl bg-slate-900 text-white">
          <p className="text-xs text-slate-400">Total Balance</p>
          <h3 className="text-2xl font-bold">$0.00</h3>
        </div>

        <div className="p-5 border border-slate-800 rounded-xl bg-slate-900 text-white">
          <p className="text-xs text-slate-400">1 USD Rate</p>
          <h3 className="text-2xl font-bold">280 PKR</h3>
        </div>
      </div>

      {/* Deposit Section */}
      <div className="p-5 border border-slate-800 rounded-xl bg-slate-900 text-white space-y-3">
        <h2 className="text-lg font-semibold text-emerald-400">Deposit Payment</h2>
        <p className="text-sm text-slate-300">
          Send payment to the EasyPaisa account below and upload proof to deposit:
        </p>
        
        <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
          <div className="text-xs text-slate-400">Account Title: <span className="text-white font-medium">Quratulain</span></div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">EasyPaisa Number</div>
              <div className="text-xl font-bold text-emerald-400">{easyPaisaNumber}</div>
            </div>
            <button
              onClick={() => handleCopy(easyPaisaNumber, "account")}
              className="px-4 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
            >
              {copiedAccount ? "Copied!" : "Copy Number"}
            </button>
          </div>
        </div>
      </div>

      {/* Referral Link */}
      <div className="p-5 border border-slate-800 rounded-xl bg-slate-900 text-white space-y-3">
        <h2 className="text-lg font-semibold">Referral System</h2>
        <p className="text-xs text-slate-400">Share your link to earn referral rewards:</p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={referLink}
            className="w-full p-2.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300"
          />
          <button
            onClick={() => handleCopy(referLink, "ref")}
            className="px-4 py-2.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg whitespace-nowrap transition"
          >
            {copiedRef ? "Copied!" : "Copy Link"}
          </button>
        </div>
      </div>

      {/* Investment Plans */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Investment Plans</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="p-5 border border-slate-800 rounded-xl bg-slate-900 text-white space-y-2">
            <h3 className="font-bold text-lg text-emerald-400">Starter Plan</h3>
            <p className="text-2xl font-bold">$1.00</p>
            <p className="text-xs text-slate-400">Daily Return: $0.10</p>
            <p className="text-xs text-slate-400">Duration: 15 Days</p>
          </div>

          <div className="p-5 border border-slate-800 rounded-xl bg-slate-900 text-white space-y-2">
            <h3 className="font-bold text-lg text-emerald-400">Basic Plan</h3>
            <p className="text-2xl font-bold">$2.00</p>
            <p className="text-xs text-slate-400">Daily Return: $0.22</p>
            <p className="text-xs text-slate-400">Duration: 15 Days</p>
          </div>

          <div className="p-5 border border-slate-800 rounded-xl bg-slate-900 text-white space-y-2">
            <h3 className="font-bold text-lg text-emerald-400">Pro Plan</h3>
            <p className="text-2xl font-bold">$5.00</p>
            <p className="text-xs text-slate-400">Daily Return: $0.60</p>
            <p className="text-xs text-slate-400">Duration: 15 Days</p>
          </div>
        </div>
      </div>
    </div>
  );
      }
