import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardComponent,
});

interface TransactionRequest {
  id: string;
  type: "deposit" | "withdraw";
  userPhone: string;
  senderName?: string;
  senderNumber?: string;
  accountNumber?: string;
  amount: string;
  trxId?: string;
  screenshotUrl?: string | null;
  status: "pending" | "approved" | "rejected";
  date: string;
}

const DEFAULT_TRANSACTIONS: TransactionRequest[] = [];
const STORAGE_KEY = "dc_transactions_v2";

function DashboardComponent() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [activeTab, setActiveTab] = useState<"home" | "plans" | "tasks" | "deposit" | "withdraw" | "refer">("home");
  
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [dollarRate, setDollarRate] = useState<number>(280);
  const [newRateInput, setNewRateInput] = useState<string>("280");

  const [copiedAccount, setCopiedAccount] = useState("");
  const [copiedRef, setCopiedRef] = useState(false);

  const [depositAmount, setDepositAmount] = useState("");
  const [depositTrxId, setDepositTrxId] = useState("");
  const [depositSenderName, setDepositSenderName] = useState("");
  const [depositSenderNumber, setDepositSenderNumber] = useState("");
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAccount, setWithdrawAccount] = useState("");

  const easyPaisaNumber = "03151390564";
  const jazzCashNumber = "03133221347";
  const referLink = `${typeof window !== "undefined" ? window.location.origin : ""}/register?ref=DC78921`;

  const [transactions, setTransactions] = useState<TransactionRequest[]>(() => {
    if (typeof window !== "undefined") {
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    }
  }, [transactions]);

  useEffect(() => {
    fetch("https://open.er-api.com/v6/latest/USD")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.rates && data.rates.PKR) {
          const livePKR = Math.round(data.rates.PKR);
          setDollarRate(livePKR);
          setNewRateInput(livePKR.toString());
        }
      })
      .catch(() => console.log("Using default rate"));
  }, []);

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  const handleSecretAdminTrigger = () => {
    if (isAdmin) {
      setShowAdminPanel(!showAdminPanel);
      return;
    }
    const pin = prompt("Enter Admin PIN:");
    if (pin === "786313") {
      setIsAdmin(true);
      setShowAdminPanel(true);
      alert("Admin Access Granted!");
    } else if (pin) {
      alert("Incorrect PIN!");
    }
  };

  const handleCopy = (text: string, label: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (label === "ref") {
        setCopiedRef(true);
        setTimeout(() => setCopiedRef(false), 2000);
      } else {
        setCopiedAccount(label);
        setTimeout(() => setCopiedAccount(""), 2000);
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setScreenshotPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleUpdateRate = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(newRateInput);
    if (!isNaN(parsed) && parsed > 0) {
      setDollarRate(parsed);
      alert(`USD Rate updated to ${parsed} PKR!`);
    }
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newReq: TransactionRequest = {
      id: `DEP-${Date.now().toString().slice(-4)}`,
      type: "deposit",
      userPhone: "03133221347",
      senderName: depositSenderName,
      senderNumber: depositSenderNumber,
      amount: depositAmount,
      trxId: depositTrxId,
      screenshotUrl: screenshotPreview,
      status: "pending",
      date: new Date().toLocaleString(),
    };
    setTransactions((prev) => [newReq, ...prev]);
    alert("Deposit request submitted! Status is Pending.");
    setDepositAmount("");
    setDepositTrxId("");
    setDepositSenderName("");
    setDepositSenderNumber("");
    setScreenshotPreview(null);
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newReq: TransactionRequest = {
      id: `WTH-${Date.now().toString().slice(-4)}`,
      type: "withdraw",
      userPhone: "03133221347",
      accountNumber: withdrawAccount,
      amount: withdrawAmount,
      status: "pending",
      date: new Date().toLocaleString(),
    };
    setTransactions((prev) => [newReq, ...prev]);
    alert("Withdrawal request submitted! Status is Pending.");
    setWithdrawAmount("");
    setWithdrawAccount("");
  };

  const updateStatus = (id: string, newStatus: "approved" | "rejected") => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
  };

  const isDark = theme === "dark";

  return (
    <div className={`min-h-screen font-sans pb-10 ${isDark ? "bg-[#040814] text-white" : "bg-slate-100 text-slate-900"}`}>
      <header className="px-4 py-4 flex justify-between items-center border-b border-slate-800/40">
        <div 
          onClick={handleSecretAdminTrigger}
          className="flex items-center gap-2 cursor-pointer select-none"
          title="Click to unlock Admin Mode"
        >
          <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-xl">
            $
          </div>
          <span className="text-2xl font-black tracking-tight text-white">
            Dollar<span className="text-amber-500">Cash</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 text-xs font-bold flex items-center gap-1"
          >
            ☀️ {isDark ? "Light" : "Dark"}
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4 pb-0 flex gap-1.5 overflow-x-auto no-scrollbar">
        {[
          { id: "home", label: "Dashboard" },
          { id: "plans", label: "Plans" },
          { id: "tasks", label: "Tasks" },
          { id: "deposit", label: "Deposit" },
          { id: "withdraw", label: "Withdraw" },
          { id: "refer", label: "Refer" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              activeTab === tab.id
                ? "bg-emerald-500 text-slate-950 shadow-md"
                : "bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <main className="max-w-md mx-auto p-4 space-y-4">
        {isAdmin && showAdminPanel && (
          <div className="p-4 rounded-2xl border border-amber-500/40 bg-amber-950/20 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-amber-400">🛡️ Admin Management Panel</h3>
              <button onClick={() => setShowAdminPanel(false)} className="text-xs text-slate-400">Close ✕</button>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-amber-400">💵 Update Dollar Rate (PKR)</h4>
              <form onSubmit={handleUpdateRate} className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={newRateInput}
                  onChange={(e) => setNewRateInput(e.target.value)}
                  className="flex-1 p-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-bold"
                />
                <button type="submit" className="px-3 py-2 bg-amber-500 font-bold text-xs text-slate-950 rounded-lg">
                  Update Rate
                </button>
              </form>
            </div>

            <h4 className="text-xs font-bold text-amber-400">All User Requests ({transactions.length})</h4>
            {transactions.length === 0 ? (
              <p className="text-xs text-slate-400">No requests found.</p>
            ) : (
              transactions.map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between font-bold">
                    <span className={item.type === "deposit" ? "text-emerald-400" : "text-amber-400"}>
                      [{item.type.toUpperCase()}] ${item.amount}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black ${
                      item.status === "pending" ? "bg-amber-500/20 text-amber-400" :
                      item.status === "approved" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  {item.type === "deposit" ? (
                    <div className="text-slate-300 text-[11px]">
                      From: {item.senderName} ({item.senderNumber}) | TRX: <span className="font-mono text-emerald-300">{item.trxId}</span>
                    </div>
                  ) : (
                    <div className="text-slate-300 text-[11px]">
                      To Account: <span className="font-mono text-amber-300">{item.accountNumber}</span>
                    </div>
                  )}

                  {item.screenshotUrl && (
                    <img src={item.screenshotUrl} alt="Proof" className="w-full h-24 object-cover rounded-lg mt-1 border border-slate-700" />
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => updateStatus(item.id, "approved")}
                      className={`flex-1 py-1 text-white rounded font-bold text-[11px] transition ${
                        item.status === "approved" ? "bg-emerald-800 cursor-not-allowed opacity-60" : "bg-emerald-600 hover:bg-emerald-500"
                      }`}
                    >
                      {item.status === "approved" ? "✓ Approved" : "Approve"}
                    </button>
                    <button
                      onClick={() => updateStatus(item.id, "rejected")}
                      className={`flex-1 py-1 text-white rounded font-bold text-[11px] transition ${
                        item.status === "rejected" ? "bg-rose-800 cursor-not-allowed opacity-60" : "bg-rose-600 hover:bg-rose-500"
                      }`}
                    >
                      {item.status === "rejected" ? "✗ Rejected" : "Reject"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "home" && (
          <div className="space-y-4">
            <div className={`p-5 rounded-3xl border ${isDark ? "bg-[#0b1120] border-slate-800/80" : "bg-white border-slate-200"} space-y-4`}>
              <div>
                <p className="text-xs font-medium text-slate-400">Available Main Balance</p>
                <h1 className="text-4xl font-black text-emerald-400 mt-1">$0.00</h1>
                <p className="text-xs text-slate-500 mt-1">≈ 0.00 PKR (1$ = {dollarRate} PKR)</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button onClick={() => setActiveTab("deposit")} className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 font-extrabold text-sm text-white flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition">
                  Deposit Money
                </button>
                <button onClick={() => setActiveTab("withdraw")} className="py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 font-extrabold text-sm text-slate-950 flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition">
                  Withdraw Cash
                </button>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border ${isDark ? "bg-[#0b1120] border-slate-800/80" : "bg-white border-slate-200"} space-y-3`}>
              <h4 className="text-xs font-bold text-slate-300">EasyPaisa Deposit Account</h4>
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-sm font-bold text-white tracking-wider">{easyPaisaNumber}</span>
                <button onClick={() => handleCopy(easyPaisaNumber, "ep")} className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold">
                  {copiedAccount === "ep" ? "Copied!" : "Copy"}
                </button>
              </div>

              <h4 className="text-xs font-bold text-slate-300 pt-1">JazzCash Deposit Account</h4>
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-sm font-bold text-white tracking-wider">{jazzCashNumber}</span>
                <button onClick={() => handleCopy(jazzCashNumber, "jc")} className="px-3 py-1 bg-amber-500 text-slate-950 rounded-lg text-xs font-bold">
                  {copiedAccount === "jc" ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "plans" && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-300">Investment Plans (15 Days Duration)</h2>
            {[
              { name: "Plan 1", cost: "$1.00", daily: "$0.15", total: "$2.25" },
              { name: "Plan 2", cost: "$2.00", daily: "$0.25", total: "$3.75" },
              { name: "Plan 3", cost: "$5.00", daily: "$0.50", total: "$7.50" },
              { name: "Plan 4", cost: "$10.00", daily: "$1.00", total: "$15.00" },
            ].map((plan, idx) => (
              <div key={idx} className={`p-4 rounded-2xl border space-y-2 ${isDark ? "bg-[#0b1120] border-slate-800/80" : "bg-white border-slate-200"}`}>
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-emerald-400">{plan.name}</h3>
                  <span className="text-xs font-black text-white">{plan.cost}</span>
                </div>
                <div className="text-xs text-slate-400 flex justify-between">
                  <span>Daily: {plan.daily}</span>
                  <span>Total: {plan.total}</span>
                </div>
                <button onClick={() => setActiveTab("deposit")} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-bold text-white transition">
                  Activate Plan
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "tasks" && (
          <div className={`p-5 rounded-2xl border text-center space-y-3 ${isDark ? "bg-[#0b1120] border-slate-800/80" : "bg-white border-slate-200"}`}>
            <h2 className="text-base font-bold">Daily Tasks ($0.15 Reward)</h2>
            <p className="text-xs text-slate-400">🔒 Active investment plan is required to unlock daily tasks.</p>
            <button onClick={() => setActiveTab("plans")} className="px-4 py-2.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl">
              Buy Plan to Unlock
            </button>
          </div>
        )}

        {activeTab === "deposit" && (
          <div className="space-y-4">
            <form onSubmit={handleDepositSubmit} className={`p-4 rounded-2xl border space-y-3 ${isDark ? "bg-[#0b1120] border-slate-800/80" : "bg-white border-slate-200"}`}>
              <h2 className="text-base font-bold text-emerald-400">Deposit Funds</h2>
              <div className="p-2.5 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex justify-between">
                <span>Current Rate:</span>
                <span className="font-bold">1 USD = {dollarRate} PKR</span>
              </div>
              <input type="text" placeholder="Sender Name" required value={depositSenderName} onChange={(e) => setDepositSenderName(e.target.value)} className="w-full p-3 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white outline-none" />
              <input type="text" placeholder="Sender Number" required value={depositSenderNumber} onChange={(e) => setDepositSenderNumber(e.target.value)} className="w-full p-3 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white outline-none" />
              <input type="number" placeholder="Amount ($)" required value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="w-full p-3 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white outline-none" />
              <input type="text" placeholder="TRX ID" required value={depositTrxId} onChange={(e) => setDepositTrxId(e.target.value)} className="w-full p-3 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white outline-none" />
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Payment Screenshot:</label>
                <input type="file" accept="image/*" onChange={handleImageChange} className="block w-full text-xs text-slate-400" />
              </div>
              <button type="submit" className="w-full py-3 bg-emerald-600 rounded-xl text-xs font-bold text-white hover:bg-emerald-500 transition">Submit Deposit Request</button>
            </form>

            <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? "bg-[#0b1120] border-slate-800/80" : "bg-white border-slate-200"}`}>
              <h3 className="text-xs font-bold text-slate-300">My Deposit History</h3>
              {transactions.filter(t => t.type === "deposit").length === 0 ? (
                <p className="text-xs text-slate-500">No deposit history.</p>
              ) : (
                transactions.filter(t => t.type === "deposit").map((item) => (
                  <div key={item.id} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-emerald-400">${item.amount}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        item.status === "pending" ? "bg-amber-500/20 text-amber-400" :
                        item.status === "approved" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">TRX: {item.trxId} • {item.date}</div>
                  </div>
                ))
        
