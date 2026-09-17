import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardComponent,
});

interface DepositRequest {
  id: string;
  userPhone: string;
  senderName: string;
  senderNumber: string;
  amount: string;
  trxId: string;
  screenshotUrl: string | null;
  status: "pending" | "approved" | "rejected";
  date: string;
}

interface WithdrawRequest {
  id: string;
  userPhone: string;
  accountNumber: string;
  amount: string;
  status: "pending" | "approved" | "rejected";
  date: string;
}

function DashboardComponent() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [activeTab, setActiveTab] = useState<"none" | "deposit" | "withdraw">("none");
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Current logged in user simulation (Replace with actual user context/Supabase auth)
  const currentUserPhone = "03133221347"; // Admin Phone
  const isAdmin = currentUserPhone === "03133221347";

  // Deposit Form Inputs
  const [depositAmount, setDepositAmount] = useState("");
  const [depositTrxId, setDepositTrxId] = useState("");
  const [depositSenderName, setDepositSenderName] = useState("");
  const [depositSenderNumber, setDepositSenderNumber] = useState("");
  const [depositScreenshot, setDepositScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  // Withdraw Form Inputs
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAccount, setWithdrawAccount] = useState("");

  // System Requests State (Admin Management)
  const [deposits, setDeposits] = useState<DepositRequest[]>([
    {
      id: "DEP-101",
      userPhone: "03001234567",
      senderName: "Ali Raza",
      senderNumber: "03001234567",
      amount: "5.00",
      trxId: "TRX982314561",
      screenshotUrl: "https://via.placeholder.com/300x150?text=Payment+Proof",
      status: "pending",
      date: "2026-09-17 09:30 AM",
    },
  ]);

  const [withdrawals, setWithdrawals] = useState<WithdrawRequest[]>([
    {
      id: "WTH-201",
      userPhone: "03129876543",
      accountNumber: "03129876543",
      amount: "2.00",
      status: "pending",
      date: "2026-09-17 09:45 AM",
    },
  ]);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDepositScreenshot(file);
      setScreenshotPreview(URL.createObjectURL(file));
    }
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || !depositTrxId || !depositSenderName || !depositSenderNumber) {
      alert("Please fill all deposit details!");
      return;
    }

    const newReq: DepositRequest = {
      id: `DEP-${Date.now().toString().slice(-4)}`,
      userPhone: currentUserPhone,
      senderName: depositSenderName,
      senderNumber: depositSenderNumber,
      amount: depositAmount,
      trxId: depositTrxId,
      screenshotUrl: screenshotPreview,
      status: "pending",
      date: new Date().toLocaleString(),
    };

    setDeposits([newReq, ...deposits]);
    alert("Deposit request submitted successfully for Admin approval!");
    setDepositAmount("");
    setDepositTrxId("");
    setDepositSenderName("");
    setDepositSenderNumber("");
    setDepositScreenshot(null);
    setScreenshotPreview(null);
    setActiveTab("none");
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || !withdrawAccount) {
      alert("Please enter withdrawal amount and account number!");
      return;
    }

    const newReq: WithdrawRequest = {
      id: `WTH-${Date.now().toString().slice(-4)}`,
      userPhone: currentUserPhone,
      accountNumber: withdrawAccount,
      amount: withdrawAmount,
      status: "pending",
      date: new Date().toLocaleString(),
    };

    setWithdrawals([newReq, ...withdrawals]);
    alert("Withdrawal request submitted successfully!");
    setWithdrawAmount("");
    setWithdrawAccount("");
    setActiveTab("none");
  };

  // Admin Actions
  const handleApproveDeposit = (id: string) => {
    setDeposits(
      deposits.map((item) => (item.id === id ? { ...item, status: "approved" } : item))
    );
  };

  const handleRejectDeposit = (id: string) => {
    setDeposits(
      deposits.map((item) => (item.id === id ? { ...item, status: "rejected" } : item))
    );
  };

  const handleApproveWithdraw = (id: string) => {
    setWithdrawals(
      withdrawals.map((item) => (item.id === id ? { ...item, status: "approved" } : item))
    );
  };

  const handleRejectWithdraw = (id: string) => {
    setWithdrawals(
      withdrawals.map((item) => (item.id === id ? { ...item, status: "rejected" } : item))
    );
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
            {isAdmin && (
              <button
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className="px-3 py-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow transition"
              >
                {showAdminPanel ? "User Panel" : "🛡️ Admin Panel"}
              </button>
            )}

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

        {/* ADMIN PANEL SECTION */}
        {isAdmin && showAdminPanel && (
          <div className="space-y-6 border-2 border-purple-500/50 p-5 rounded-2xl bg-purple-950/20">
            <h2 className="text-xl font-extrabold text-purple-400 flex items-center gap-2">
              🛡️ Admin Verification Panel (03133221347)
            </h2>

            {/* Pending Deposits */}
            <div className="space-y-3">
              <h3 className="text-base font-bold text-emerald-400">Deposit Approvals</h3>
              {deposits.filter((d) => d.status === "pending").length === 0 ? (
                <p className="text-xs text-slate-400">No pending deposits.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {deposits
                    .filter((d) => d.status === "pending")
                    .map((item) => (
                      <div
                        key={item.id}
                        className={`p-4 border rounded-xl space-y-2 ${
                          isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                        }`}
                      >
                        <div className="flex justify-between text-xs font-bold text-amber-500">
                          <span>Req ID: {item.id}</span>
                          <span>${item.amount}</span>
                        </div>
                        <div className="text-xs space-y-1 text-slate-300">
                          <div>User: <span className="font-semibold text-white">{item.userPhone}</span></div>
                          <div>Sender Name: <span className="font-semibold text-white">{item.senderName}</span></div>
                          <div>Sender Number: <span className="font-semibold text-white">{item.senderNumber}</span></div>
                          <div>TRX ID: <span className="font-mono text-emerald-400">{item.trxId}</span></div>
                          <div>Date: {item.date}</div>
                        </div>

                        {item.screenshotUrl && (
                          <div className="pt-2">
                            <p className="text-[10px] text-slate-400 mb-1">Payment Proof:</p>
                            <img
                              src={item.screenshotUrl}
                              alt="Screenshot"
                              className="w-full h-32 object-cover rounded-lg border border-slate-700"
                            />
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => handleApproveDeposit(item.id)}
                            className="flex-1 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectDeposit(item.id)}
                            className="flex-1 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Pending Withdrawals */}
            <div className="space-y-3 pt-4 border-t border-purple-800/40">
              <h3 className="text-base font-bold text-amber-400">Withdrawal Approvals</h3>
              {withdrawals.filter((w) => w.status === "pending").length === 0 ? (
                <p className="text-xs text-slate-400">No pending withdrawals.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {withdrawals
                    .filter((w) => w.status === "pending")
                    .map((item) => (
                      <div
                        key={item.id}
                        className={`p-4 border rounded-xl space-y-2 ${
                          isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                        }`}
                      >
                        <div className="flex justify-between text-xs font-bold text-amber-500">
                          <span>Req ID: {item.id}</span>
                          <span>${item.amount}</span>
                        </div>
                        <div className="text-xs space-y-1 text-slate-300">
                          <div>User: <span className="font-semibold text-white">{item.userPhone}</span></div>
                          <div>Account Number: <span className="font-semibold text-emerald-400">{item.accountNumber}</span></div>
                          <div>Date: {item.date}</div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => handleApproveWithdraw(item.id)}
                            className="flex-1 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectWithdraw(item.id)}
                            className="flex-1 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MAIN USER DASHBOARD */}
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

        {/* Deposit Form Section */}
        {activeTab === "deposit" && (
          <form
            onSubmit={handleDepositSubmit}
            className={`p-6 border rounded-2xl space-y-4 shadow-lg ${
              isDark ? "bg-slate-900 border-emerald-500/40" : "bg-white border-emerald-400"
            }`}
          >
            <h3 className="text-lg font-bold text-emerald-500">Deposit Funds via EasyPaisa</h3>
            <p className="text-xs text-slate-400">
              Send payment to EasyPaisa: <span className="font-bold text-amber-500">03151390564 (Quratulain)</span> then enter sender info & TRX ID.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Sender Name"
                required
                value={depositSenderName}
                onChange={(e) => setDepositSenderName(e.target.value)}
                className={`p-3 text-xs border rounded-xl ${
                  isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-100 border-slate-300"
                }`}
              />
              <input
                type="text"
                placeholder="Sender Mobile Number"
                required
                value={depositSenderNumber}
                onChange={(e) => setDepositSenderNumber(e.target.value)}
                className={`p-3 text-xs border rounded-xl ${
                  isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-100 border-slate-300"
                }`}
              />
              <input
                type="number"
                placeholder="Deposit Amount ($)"
                required
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className={`p-3 text-xs border rounded-xl ${
                  isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-100 border-slate-300"
                }`}
              />
              <input
                type="text"
                placeholder="EasyPaisa TRX ID"
                required
                value={depositTrxId}
                onChange={(e) => setDepositTrxId(e.target.value)}
                className={`p-3 text-xs border rounded-xl ${
                  isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-100 border-slate-300"
                }`}
              />
            </div>

            {/* Screenshot Upload Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400">Upload Payment Screenshot (Optional/Recommended)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500"
              />
              {screenshotPreview && (
                <div className="mt-2">
                  <img src={screenshotPreview} alt="Preview" className="h-28 rounded-lg border border-slate-700" />
                </div>
              )}
            </div>

            <button
              type="submit"
              className="px-6 py-3 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition"
            >
              Submit Deposit Request
            </button>
          </form>
        )}

        {/* Withdraw Form Section */}
        {activeTab === "withdraw" && (
          <form
            onSubmit={handleWithdrawSubmit}
            className={`p-6 border rounded-2xl space-y-4 shadow-lg ${
              isDark ? "bg-slate-900 border-amber-500/40" : "bg-white border-amber-400"
            }`}
          >
            <h3 className="text-lg font-bold text-amber-500">Withdraw Funds to EasyPaisa</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="number"
                placeholder="Withdraw Amount ($)"
                required
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className={`p-3 text-xs border rounded-xl ${
                  isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-100 border-slate-300"
                }`}
              />
              <input
                type="text"
                placeholder="EasyPaisa Account Number"
                required
                value={withdrawAccount}
                onChange={(e) => setWithdrawAccount(e.target.value)}
                className={`p-3 text-xs border rounded-xl ${
                  isDark ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-100 border-slate-300"
                }`}
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 text-xs font-bold bg-amber-500 text-slate-950 rounded-xl hover:bg-amber-400 transition"
            >
              Request Withdrawal
            </button>
          </form>
        )}

        {/* Stats Grid */}
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
          <p className="text-xs font-medium text-slate-400">Official EasyPaisa Deposit Account</p>
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
              type="button"
              onClick={() => handleCopy(easyPaisaNumber, "account")}
              className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition active:scale-95 shadow"
            >
              {copiedAccount ? "Copied!" : "Copy"}
            </button>
          </div>
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
              type="button"
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
                  type="button"
                  onClick={() => {
                    setActiveTab("deposit");
                    alert(`To activate ${plan.name}, send ${plan.cost} via EasyPaisa and submit form.`);
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
