import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

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

function DashboardComponent() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [activeTab, setActiveTab] = useState<"home" | "plans" | "tasks" | "deposit" | "withdraw" | "refer">("home");
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // DYNAMIC DOLLAR RATE STATE
  const [dollarRate, setDollarRate] = useState<number>(280);
  const [newRateInput, setNewRateInput] = useState<string>("280");

  const [copiedAccount, setCopiedAccount] = useState("");
  const [copiedRef, setCopiedRef] = useState(false);

  // User state
  const currentUserPhone = "03133221347";
  const isAdmin = currentUserPhone === "03133221347";

  // Form States
  const [depositAmount, setDepositAmount] = useState("");
  const [depositTrxId, setDepositTrxId] = useState("");
  const [depositSenderName, setDepositSenderName] = useState("");
  const [depositSenderNumber, setDepositSenderNumber] = useState("");
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAccount, setWithdrawAccount] = useState("");

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

  const easyPaisaNumber = "03151390564";
  const jazzCashNumber = "03133221347";
  const referLink = `${typeof window !== "undefined" ? window.location.origin : ""}/register?ref=DC78921`;

  // Live Auto Fetch Option (Optional API Integration)
  useEffect(() => {
    // Exchange rate API se live rate lene ke liye:
    fetch("https://open.er-api.com/v6/latest/USD")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.rates && data.rates.PKR) {
          const livePKR = Math.round(data.rates.PKR);
          setDollarRate(livePKR);
          setNewRateInput(livePKR.toString());
        }
      })
      .catch((err) => console.log("Exchange API error, using default rate:", err));
  }, []);

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

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
      alert(`USD Rate updated to ${parsed} PKR successfully!`);
    }
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    alert("Deposit request submitted!");
    setDepositAmount("");
    setDepositTrxId("");
    setDepositSenderName("");
    setDepositSenderNumber("");
    setScreenshotPreview(null);
  };

  const isDark = theme === "dark";

  return (
    <div className={`min-h-screen pb-24 font-sans ${isDark ? "bg-[#070b14] text-slate-100" : "bg-slate-100 text-slate-900"}`}>
      {/* Top Header */}
      <header className={`px-4 py-3 flex justify-between items-center border-b ${isDark ? "border-slate-800/60 bg-[#070b14]" : "border-slate-200 bg-white"}`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
            🛡️
          </div>
          <span className="text-xl font-black tracking-tight text-white">
            Dollar<span className="text-amber-400">Cash</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-semibold flex items-center gap-1.5">
            <span className="text-[10px] tracking-wider text-slate-400 font-bold">BALANCE</span>
            <span className="text-emerald-400 font-extrabold">$0.00</span>
          </div>

          <button onClick={toggleTheme} className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs">
            <span className={isDark ? "opacity-40" : "opacity-100"}>☀️</span>
            <div className={`w-8 h-4 rounded-full p-0.5 transition ${isDark ? "bg-emerald-500" : "bg-slate-600"}`}>
              <div className={`w-3 h-3 rounded-full bg-white transition transform ${isDark ? "translate-x-4" : "translate-x-0"}`} />
            </div>
            <span className={isDark ? "opacity-100" : "opacity-40"}>🌙</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* Dashboard Title & Sign Out */}
        <div className="flex justify-between items-start pt-1">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Dashboard</h1>
            <p className="text-xs text-slate-400">Welcome to DollarCash</p>
          </div>
          <button className="text-xs text-slate-300 hover:text-white flex items-center gap-1 pt-1 font-medium">
            <span>[→</span> Sign out
          </button>
        </div>

        {/* Admin Panel Button */}
        {isAdmin && (
          <button
            onClick={() => setShowAdminPanel(!showAdminPanel)}
            className="w-full py-3 rounded-xl border border-amber-500/80 text-amber-400 font-bold text-xs flex items-center justify-center gap-2 bg-amber-950/20 shadow-md active:scale-98 transition"
          >
            🛡️ 👑 Open Admin Panel
          </button>
        )}

        {/* Admin Panel View */}
        {isAdmin && showAdminPanel && (
          <div className="p-4 rounded-2xl border border-amber-500/40 bg-amber-950/10 space-y-4">
            {/* Update Dollar Rate Section */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-amber-400">💵 Admin Dollar Rate Control</h4>
              <form onSubmit={handleUpdateRate} className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={newRateInput}
                  onChange={(e) => setNewRateInput(e.target.value)}
                  className="flex-1 p-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-bold"
                  placeholder="Rate in PKR"
                />
                <button type="submit" className="px-3 py-2 bg-amber-500 font-bold text-xs text-slate-950 rounded-lg">
                  Update
                </button>
              </form>
            </div>

            <h3 className="text-sm font-bold text-amber-400">Pending Deposit Requests</h3>
            {deposits.filter((d) => d.status === "pending").length === 0 ? (
              <p className="text-xs text-slate-400">No pending deposits.</p>
            ) : (
              deposits
                .filter((d) => d.status === "pending")
                .map((item) => (
                  <div key={item.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-amber-400">
                      <span>
                        {item.senderName} ({item.senderNumber})
                      </span>
                      <span>${item.amount}</span>
                    </div>
                    <div className="text-slate-300">
                      TRX ID: <span className="text-emerald-400 font-mono">{item.trxId}</span>
                    </div>
                    {item.screenshotUrl && (
                      <img src={item.screenshotUrl} alt="Proof" className="w-full h-28 object-cover rounded-lg mt-1 border border-slate-700" />
                    )}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => setDeposits(deposits.map((d) => (d.id === item.id ? { ...d, status: "approved" } : d)))}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setDeposits(deposits.map((d) => (d.id === item.id ? { ...d, status: "rejected" } : d)))}
                        className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {/* HOME TAB */}
        {activeTab === "home" && (
          <div className="space-y-3">
            <div className={`p-5 rounded-2xl border flex justify-between items-center ${isDark ? "bg-[#0d1424] border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
              <div>
                <p className="text-xs font-semibold text-slate-400">Total Balance</p>
                <h2 className="text-3xl font-black text-white mt-1">$15.50</h2>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-lg">
                👛
              </div>
            </div>

            {/* LIVE DYNAMIC DOLLAR RATE CARD */}
            <div className={`p-5 rounded-2xl border flex justify-between items-center ${isDark ? "bg-[#0d1424] border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
              <div>
                <p className="text-xs font-semibold text-slate-400">1 USD Rate</p>
                <h2 className="text-2xl font-extrabold text-white mt-1">{dollarRate} PKR</h2>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-lg">
                📈
              </div>
            </div>

            {/* EasyPaisa */}
            <div className={`p-4 rounded-2xl border flex justify-between items-center ${isDark ? "bg-[#0d1424] border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
              <div>
                <p className="text-xs font-semibold text-slate-400">EasyPaisa Account</p>
                <h3 className="text-lg font-bold text-white tracking-wider mt-0.5">{easyPaisaNumber}</h3>
              </div>
              <button onClick={() => handleCopy(easyPaisaNumber, "ep")} className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center text-amber-400 font-bold text-sm">
                {copiedAccount === "ep" ? "✓" : "$"}
              </button>
            </div>

            {/* JazzCash */}
            <div className={`p-4 rounded-2xl border flex justify-between items-center ${isDark ? "bg-[#0d1424] border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
              <div>
                <p className="text-xs font-semibold text-slate-400">JazzCash Account</p>
                <h3 className="text-lg font-bold text-white tracking-wider mt-0.5">{jazzCashNumber}</h3>
              </div>
              <button onClick={() => handleCopy(jazzCashNumber, "jc")} className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center text-blue-400 font-bold text-sm">
                {copiedAccount === "jc" ? "✓" : "👤"}
              </button>
            </div>
          </div>
        )}

        {/* PLANS TAB */}
        {activeTab === "plans" && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-300">Investment Plans (15 Days)</h2>
            {[
              { name: "Plan 1", cost: "$1.00", daily: "$0.15", total: "$2.25" },
              { name: "Plan 2", cost: "$2.00", daily: "$0.25", total: "$3.75" },
              { name: "Plan 3", cost: "$5.00", daily: "$0.50", total: "$7.50" },
              { name: "Plan 4", cost: "$10.00", daily: "$1.00", total: "$15.00" },
            ].map((plan, idx) => (
              <div key={idx} className={`p-4 rounded-2xl border space-y-2 ${isDark ? "bg-[#0d1424] border-slate-800" : "bg-white border-slate-200"}`}>
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-emerald-400">{plan.name}</h3>
                  <span className="text-xs font-black text-white">{plan.cost}</span>
                </div>
                <div className="text-xs text-slate-400 flex justify-between">
                  <span>Daily: {plan.daily}</span>
                  <span>Total: {plan.total}</span>
                </div>
                <button onClick={() => setActiveTab("deposit")} className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-bold text-white transition">
                  Activate Plan
                </button>
              </div>
            ))}
          </div>
        )}

        {/* TASKS TAB */}
        {activeTab === "tasks" && (
          <div className={`p-5 rounded-2xl border text-center space-y-3 ${isDark ? "bg-[#0d1424] border-slate-800" : "bg-white border-slate-200"}`}>
            <h2 className="text-base font-bold">Daily Tasks ($0.15 Reward)</h2>
            <p className="text-xs text-slate-400">🔒 Active investment plan is required to unlock daily tasks.</p>
            <button onClick={() => setActiveTab("plans")} className="px-4 py-2.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl">
              Buy Plan to Unlock
            </button>
          </div>
        )}

        {/* DEPOSIT TAB */}
        {activeTab === "deposit" && (
          <form onSubmit={handleDepositSubmit} className={`p-4 rounded-2xl border space-y-3 ${isDark ? "bg-[#0d1424] border-slate-800" : "bg-white border-slate-200"}`}>
            <h2 className="text-base font-bold text-emerald-400">Deposit Funds</h2>
            <div className="p-2.5 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex justify-between">
              <span>Current Rate:</span>
              <span className="font-bold">1 USD = {dollarRate} PKR</span>
            </div>
            <input type="text" placeholder="Sender Name" required value={depositSenderName} onChange={(e) => setDepositSenderName(e.target.value)} className="w-full p-3 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500" />
            <input type="text" placeholder="Sender Number" required value={depositSenderNumber} onChange={(e) => setDepositSenderNumber(e.target.value)} className="w-full p-3 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500" />
            <input type="number" placeholder="Amount ($)" required value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="w-full p-3 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500" />
            <input type="text" placeholder="TRX ID" required value={depositTrxId} onChange={(e) => setDepositTrxId(e.target.value)} className="w-full p-3 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500" />
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Payment Screenshot Proof:</label>
              <input type="file" accept="image/*" onChange={handleImageChange} className="block w-full text-xs text-slate-400" />
            </div>
            <button type="submit" className="w-full py-3 bg-emerald-600 rounded-xl text-xs font-bold text-white hover:bg-emerald-500 transition">Submit Deposit</button>
          </form>
        )}

        {/* WITHDRAW TAB */}
        {activeTab === "withdraw" && (
          <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? "bg-[#0d1424] border-slate-800" : "bg-white border-slate-200"}`}>
            <h2 className="text-base font-bold text-amber-400">Withdraw Funds</h2>
            <div className="p-2.5 bg-amber-950/20 border border-amber-500/30 rounded-xl text-xs text-amber-400 flex justify-between">
              <span>Payout Rate:</span>
              <span className="font-bold">1 USD = {dollarRate} PKR</span>
            </div>
            <input type="number" placeholder="Amount ($)" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} className="w-full p-3 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white outline-none" />
            <input type="text" placeholder="Account Number" value={withdrawAccount} onChange={(e) => setWithdrawAccount(e.target.value)} className="w-full p-3 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white outline-none" />
            <button onClick={() => alert("Withdraw request submitted!")} className="w-full py-3 bg-amber-500 rounded-xl text-xs font-bold text-slate-950">Submit Request</button>
          </div>
        )}

        {/* REFER TAB */}
        {activeTab === "refer" && (
          <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? "bg-[#0d1424] border-slate-800" : "bg-white border-slate-200"}`}>
            <h2 className="text-base font-bold">Referral Program</h2>
            <div className="flex gap-2">
              <input type="text" readOnly value={referLink} className="w-full p-2.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-emerald-400 font-mono" />
              <button onClick={() => handleCopy(referLink, "ref")} className="px-4 py-2.5 bg-blue-600 rounded-xl text-xs font-bold text-white">{copiedRef ? "Copied!" : "Copy"}</button>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {[
                { target: 5, reward: "$1.00" },
                { target: 10, reward: "$2.00" },
                { target: 25, reward: "$5.00" },
                { target: 50, reward: "$10.00" },
              ].map((item, i) => (
                <div key={i} className="p-3 border border-slate-800 bg-slate-900/60 rounded-xl text-center">
                  <div className="text-[10px] text-slate-400 font-medium">{item.target} Referrals</div>
                  <div className="text-base font-black text-amber-400 mt-0.5">{item.reward}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className={`fixed bottom-0 left-0 right-0 border-t flex justify-around items-center py-2.5 px-2 z-50 ${isDark ? "bg-[#070b14] border-slate-800/80" : "bg-white border-slate-200"}`}>
        {[
          { id: "home", label: "Home", icon: "⊞" },
          { id: "plans", label: "Plans", icon: "👛" },
          { id: "tasks", label: "Tasks", icon: "≡" },
          { id: "deposit", label: "Deposit", icon: "↓" },
          { id: "withdraw", label: "Withdraw", icon: "↑" },
          { id: "refer", label: "Refer", icon: "👥" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center gap-1 text-[11px] font-medium transition ${isActive ? "text-emerald-400 font-bold" : "text-slate-400 hover:text-slate-200"}`}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
