import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardComponent,
});

function DashboardComponent() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [activeTab, setActiveTab] = useState<"none" | "deposit" | "withdraw">("none");

  // Form States
  const [depositAmount, setDepositAmount] = useState("");
  const [depositTid, setDepositTid] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAccount, setWithdrawAccount] = useState("");

  // User financial state simulation (In real app, fetch from Supabase)
  const isPaidUser = false;
  const activePlanName = isPaidUser ? "Plan 1 ($1.00)" : "No Active Plan";
  const planDaysRemaining = isPaidUser ? "12 Days" : "N/A";
  
  const userStats = {
    mainBalance: "$0.00",
    totalDeposit: "$0.00",
    totalWithdraw: "$0.00",
    referralEarning: "$0.00",
    activeReferrals: 0,
  };

  const easyPaisaNumber = "03151390564";
  const referLink = `${typeof window !== "undefined" ? window.location.origin : ""}/register?ref=DC78921`;

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  const handleCopy = (text: string, type: "account" | "ref") => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (type === "account") {
        setCopiedAccount(true);
        setTimeout(() => setCopiedAccount(false), 2000);
      } else {
        setCopiedRef(true);
        setTimeout(() => setCopiedRef(false), 2000);
      }
    }
  };

  const referralMilestones = [
    { target: 5, reward: "$1.00" },
    { target: 10, reward: "$2.00" },
    { target: 25, reward: "$5.00" },
    { target: 50, reward: "$10.00" },
  ];

  const isDark = theme === "dark";

  return (
    <div
      className={`min-h-screen p-4 sm:p-6 transition-colors duration-300 ${
        isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div
          className={`flex justify-between items-center border-b pb-4 ${
            isDark ? "border-slate-800" : "border-slate-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-slate-950 text-2xl shadow-md">
              $
            </div>
            <span className="text-2xl font-extrabold tracking-wide">
              Dollar<span className="text-amber-500">Cash</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`hidden sm:inline-block px-3 py-1 border text-xs rounded-full font-semibold ${
                isDark
                  ? "bg-emerald-950/50 border-emerald-700/50 text-emerald-400"
                  : "bg-emerald-100 border-emerald-300 text-emerald-800"
              }`}
            >
              1 USD = 280 PKR
            </span>

            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition shadow-sm ${
                isDark
                  ? "bg-slate-900 border-slate-700 text-amber-400 hover:bg-slate-800"
                  : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {isDark ? "☀️ Light" : "🌙 Dark"}
            </button>
          </div>
        </div>

        {/* Quick Deposit / Withdraw Action Buttons & Main Wallet Header */}
        <div
          className={`p-6 border rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
            isDark ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          <div>
            <p className="text-xs font-medium text-slate-400">Available Main Balance</p>
            <h3 className="text-4xl font-black text-emerald-500 mt-1">{userStats.mainBalance}</h3>
            <p className="text-xs text-slate-400 mt-1">≈ 0.00 PKR</p>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={() => setActiveTab(activeTab === "deposit" ? "none" : "deposit")}
              className="flex-1 md:flex-none px-6 py-3 font-extrabold text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition active:scale-95"
            >
              ➕ Deposit Money
            </button>
            <button
              onClick={() => setActiveTab(activeTab === "withdraw" ? "none" : "withdraw")}
              className="flex-1 md:flex-none px-6 py-3 font-extrabold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-md transition active:scale-95"
            >
              💸 Withdraw Cash
            </button>
          </div>
        </div>

        {/* Action Panel for Deposit / Withdraw Forms */}
        {activeTab === "deposit" && (
          <div
            className={`p-6 border rounded-2xl space-y-4 shadow-lg ${
              isDark ? "bg-slate-900 border-emerald-500/40" : "bg-white border-emerald-400"
            }`}
          >
            <h3 className="text-lg font-bold text-emerald-500">Deposit Funds via EasyPaisa</h3>
            <p className="text-xs text-slate-400">
              Send payment to EasyPaisa: <span className="font-bold text-amber-500">03151390564 (Quratulain)</span> then enter details below.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="number"
                placeholder="Deposit Amount ($)"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className={`p-3 text-xs border rounded-xl ${
                  isDark ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-300"
                }`}
              />
              <input
                type="text"
                placeholder="EasyPaisa Transaction ID (TID)"
                value={depositTid}
                onChange={(e) => setDepositTid(e.target.value)}
                className={`p-3 text-xs border rounded-xl ${
                  isDark ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-300"
                }`}
              />
            </div>
            <button
              onClick={() => alert("Deposit request submitted for admin review!")}
              className="px-6 py-3 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-500"
            >
              Submit Deposit Request
            </button>
          </div>
        )}

        {activeTab === "withdraw" && (
          <div
            className={`p-6 border rounded-2xl space-y-4 shadow-lg ${
              isDark ? "bg-slate-900 border-amber-500/40" : "bg-white border-amber-400"
            }`}
          >
            <h3 className="text-lg font-bold text-amber-500">Withdraw Funds to EasyPaisa</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="number"
                placeholder="Withdraw Amount ($)"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className={`p-3 text-xs border rounded-xl ${
                  isDark ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-300"
                }`}
              />
              <input
                type="text"
                placeholder="EasyPaisa Mobile Number"
                value={withdrawAccount}
                onChange={(e) => setWithdrawAccount(e.target.value)}
                className={`p-3 text-xs border rounded-xl ${
                  isDark ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-300"
                }`}
              />
            </div>
            <button
              onClick={() => alert("Withdrawal request submitted!")}
              className="px-6 py-3 text-xs font-bold bg-amber-500 text-slate-950 rounded-xl hover:bg-amber-400"
            >
              Request Withdrawal
            </button>
          </div>
        )}

        {/* Detailed Stats Cards Grid (Deposit, Withdraw, Referral, Active Plan) */}
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          <div
            className={`p-4 border rounded-2xl ${
              isDark ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200"
            }`}
          >
            <p className="text-[11px] font-semibold text-slate-400">Total Invested</p>
            <h4 className="text-xl font-extrabold text-emerald-400 mt-1">{userStats.totalDeposit}</h4>
          </div>

          <div
            className={`p-4 border rounded-2xl ${
              isDark ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200"
            }`}
          >
            <p className="text-[11px] font-semibold text-slate-400">Total Withdrawn</p>
            <h4 className="text-xl font-extrabold text-amber-400 mt-1">{userStats.totalWithdraw}</h4>
          </div>

          <div
            className={`p-4 border rounded-2xl ${
              isDark ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200"
            }`}
          >
            <p className="text-[11px] font-semibold text-slate-400">Referral Earnings</p>
            <h4 className="text-xl font-extrabold text-blue-400 mt-1">{userStats.referralEarning}</h4>
          </div>

          <div
            className={`p-4 border rounded-2xl ${
              isDark ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200"
            }`}
          >
            <p className="text-[11px] font-semibold text-slate-400">Active Plan</p>
            <h4 className="text-sm font-bold text-emerald-500 mt-1">{activePlanName}</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Time Left: {planDaysRemaining}</p>
          </div>
        </div>

        {/* EasyPaisa Payment Account Box */}
        <div
          className={`p-5 border rounded-2xl shadow-sm space-y-2 ${
            isDark ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          <p className="text-xs font-medium text-slate-400">Official EasyPaisa Account</p>
          <div
            className={`flex items-center justify-between p-3 rounded-xl border ${
              isDark ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-300"
            }`}
          >
            <div>
              <div className="text-[11px] text-amber-500 font-bold">Quratulain</div>
              <div className="text-sm font-extrabold tracking-wider">{easyPaisaNumber}</div>
            </div>
            <button
              onClick={() => handleCopy(easyPaisaNumber, "account")}
              className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition active:scale-95 shadow"
            >
              {copiedAccount ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Restricted Daily Tasks Panel */}
        <div
          className={`p-5 border rounded-2xl shadow-sm space-y-3 ${
            isDark ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold">Daily Tasks ($0.15 Reward)</h2>
            {!isPaidUser && (
              <span className="text-xs font-semibold text-amber-500 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-md">
                🔒 Paid Members Only
              </span>
            )}
          </div>
          {!isPaidUser ? (
            <div
              className={`p-4 border rounded-xl text-center space-y-3 ${
                isDark ? "bg-slate-950/80 border-slate-800" : "bg-slate-50 border-slate-200"
              }`}
            >
              <p className="text-xs text-slate-400">
                Buy at least 1 active investment plan to unlock daily tasks reward.
              </p>
              <button className="px-5 py-2.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition shadow active:scale-95">
                Upgrade Plan to Unlock
              </button>
            </div>
          ) : (
            <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow active:scale-95">
              Claim Daily Task ($0.15)
            </button>
          )}
        </div>

        {/* Milestone Referral Cash Rewards */}
        <div
          className={`p-5 border rounded-2xl shadow-sm space-y-4 ${
            isDark ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold">Referral Cash Rewards</h2>
            <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-md">
              Active Referrals: {userStats.activeReferrals}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={referLink}
              className={`w-full p-3 text-xs border rounded-xl font-mono ${
                isDark ? "bg-slate-950 border-slate-800 text-emerald-400" : "bg-slate-100 border-slate-300 text-emerald-700"
              }`}
            />
            <button
              onClick={() => handleCopy(referLink, "ref")}
              className="px-5 py-3 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl whitespace-nowrap transition active:scale-95 shadow"
            >
              {copiedRef ? "Copied!" : "Copy Link"}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {referralMilestones.map((item, idx) => {
              const isUnlocked = userStats.activeReferrals >= item.target;
              return (
                <div
                  key={idx}
                  className={`p-3 border rounded-xl text-center space-y-1 transition ${
                    isUnlocked
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                      : isDark
                      ? "bg-slate-950/60 border-slate-800 text-slate-400"
                      : "bg-slate-100 border-slate-200 text-slate-500"
                  }`}
                >
                  <div className="text-[11px] font-medium">{item.target} Referrals</div>
                  <div className="text-lg font-black text-amber-500">{item.reward}</div>
                  <div className="text-[10px] font-semibold">
                    {isUnlocked ? "✓ Unlocked" : "Locked"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Investment Plans Grid */}
        <div className="space-y-4">
          <h2 className="text-base font-bold">Investment Plans (15 Days Validity)</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: "Plan 1", cost: "$1.00", daily: "$0.15", total: "$2.25" },
              { name: "Plan 2", cost: "$2.00", daily: "$0.25", total: "$3.75" },
              { name: "Plan 3", cost: "$5.00", daily: "$0.50", total: "$7.50" },
              { name: "Plan 4", cost: "$10.00", daily: "$1.00", total: "$15.00" },
            ].map((plan, idx) => (
              <div
                key={idx}
                className={`p-5 border rounded-2xl shadow-sm space-y-4 relative overflow-hidden ${
                  isDark ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200"
                }`}
              >
                <div className="absolute top-0 right-0 bg-emerald-500/20 text-emerald-500 text-[10px] font-bold px-3 py-1 rounded-bl-xl border-b border-l border-emerald-500/30">
                  15 DAYS
                </div>
                <h3 className="font-extrabold text-lg text-emerald-500">{plan.name}</h3>
                <div className="text-3xl font-black">{plan.cost}</div>
                <div
                  className={`text-xs space-y-1 pt-3 border-t ${
                    isDark ? "border-slate-800 text-slate-300" : "border-slate-200 text-slate-600"
                  }`}
                >
                  <div>
                    Daily Return: <span className="text-emerald-500 font-bold">{plan.daily}</span>
                  </div>
                  <div>
                    Total Return: <span className="text-amber-500 font-bold">{plan.total}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveTab("deposit");
                    alert(`To activate ${plan.name}, please deposit ${plan.cost} via EasyPaisa.`);
                  }}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow active:scale-95"
                >
                  Activate Plan
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
