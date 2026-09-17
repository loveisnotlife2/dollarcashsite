import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardComponent,
});

function DashboardComponent() {
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  
  // User data state (In practical setup, fetched from backend/Supabase)
  const isPaidUser = false; // Set to true when user has an active plan
  const activeReferralsCount = 0; // Number of active paid referrals

  const easyPaisaNumber = "03151390564";
  const referLink = `${window.location.origin}/register?ref=DC78921`;

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

  const referralMilestones = [
    { target: 5, reward: "$1.00" },
    { target: 10, reward: "$2.00" },
    { target: 25, reward: "$5.00" },
    { target: 50, reward: "$10.00" },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto bg-slate-950 text-slate-100 min-h-screen">
      {/* Header / Brand */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-slate-950 text-xl">
            $
          </div>
          <span className="text-xl font-extrabold text-white tracking-wide">
            Dollar<span className="text-amber-400">Cash</span>
          </span>
        </div>
        <span className="px-3 py-1 bg-emerald-900/40 border border-emerald-700/50 text-emerald-400 text-xs rounded-full font-medium">
          PKR Rate: 280
        </span>
      </div>

      {/* Wallet Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="p-5 border border-slate-800 rounded-2xl bg-slate-900/80 shadow-lg">
          <p className="text-xs text-slate-400 font-medium">Main Balance</p>
          <h3 className="text-3xl font-extrabold text-emerald-400 mt-1">$0.00</h3>
          <p className="text-[10px] text-slate-500 mt-1">≈ 0.00 PKR</p>
        </div>

        <div className="p-5 border border-slate-800 rounded-2xl bg-slate-900/80 shadow-lg space-y-2">
          <p className="text-xs text-slate-400 font-medium">Deposit Gateway</p>
          <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div>
              <div className="text-[11px] text-amber-400 font-semibold">EasyPaisa (Quratulain)</div>
              <div className="text-sm font-bold text-white tracking-wider">{easyPaisaNumber}</div>
            </div>
            <button
              onClick={() => handleCopy(easyPaisaNumber, "account")}
              className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
            >
              {copiedAccount ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      </div>

      {/* Restricted Daily Tasks Panel */}
      <div className="p-5 border border-slate-800 rounded-2xl bg-slate-900/80 space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-white">Daily Tasks ($0.15 Reward)</h2>
          {!isPaidUser && (
            <span className="text-xs text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2.5 py-0.5 rounded-md">
              🔒 Paid Members Only
            </span>
          )}
        </div>
        {!isPaidUser ? (
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl text-center space-y-2">
            <p className="text-xs text-slate-400">
              Buy at least 1 active investment plan to unlock daily tasks reward.
            </p>
            <button className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg">
              Upgrade Plan to Unlock
            </button>
          </div>
        ) : (
          <button className="w-full py-3 bg-emerald-600 font-bold text-xs rounded-xl hover:bg-emerald-500">
            Claim Daily Task ($0.15)
          </button>
        )}
      </div>

      {/* Referral Link & Milestone Rewards Box */}
      <div className="p-5 border border-slate-800 rounded-2xl bg-slate-900/80 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-white">Referral Cash Rewards</h2>
          <span className="text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 rounded-md">
            Active Referrals: {activeReferralsCount}
          </span>
        </div>

        {/* Shareable Link Input */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={referLink}
            className="w-full p-2.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-mono"
          />
          <button
            onClick={() => handleCopy(referLink, "ref")}
            className="px-4 py-2.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl whitespace-nowrap"
          >
            {copiedRef ? "Copied!" : "Copy Link"}
          </button>
        </div>

        {/* Milestone Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {referralMilestones.map((item, idx) => {
            const isUnlocked = activeReferralsCount >= item.target;
            return (
              <div
                key={idx}
                className={`p-3 border rounded-xl text-center space-y-1 transition ${
                  isUnlocked
                    ? "bg-emerald-950/40 border-emerald-600/60 text-white"
                    : "bg-slate-950/60 border-slate-800 text-slate-400"
                }`}
              >
                <div className="text-[11px] font-medium text-slate-400">
                  {item.target} Referrals
                </div>
                <div className="text-lg font-extrabold text-amber-400">
                  {item.reward}
                </div>
                <div className="text-[10px] font-semibold">
                  {isUnlocked ? (
                    <span className="text-emerald-400">✓ Unlocked</span>
                  ) : (
                    <span className="text-slate-500">Locked</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Investment Plans Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">Investment Plans (15 Days Validity)</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { name: "Plan 1", cost: "$1.00", daily: "$0.15", total: "$2.25" },
            { name: "Plan 2", cost: "$2.00", daily: "$0.25", total: "$3.75" },
            { name: "Plan 3", cost: "$5.00", daily: "$0.50", total: "$7.50" },
            { name: "Plan 4", cost: "$10.00", daily: "$1.00", total: "$15.00" },
          ].map((plan, idx) => (
            <div key={idx} className="p-5 border border-slate-800 rounded-2xl bg-slate-900/90 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-600/20 text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-bl-xl border-b border-l border-emerald-500/30">
                15 DAYS
              </div>
              <h3 className="font-extrabold text-lg text-emerald-400">{plan.name}</h3>
              <div className="text-2xl font-black text-white">{plan.cost}</div>
              <div className="text-xs text-slate-300 space-y-1 pt-2 border-t border-slate-800">
                <div>Daily Return: <span className="text-emerald-400 font-semibold">{plan.daily}</span></div>
                <div>Total Return: <span className="text-amber-400 font-semibold">{plan.total}</span></div>
              </div>
              <button className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl transition">
                Activate Plan
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
