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
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Dynamic Dollar Rate State
  const [dollarRate, setDollarRate] = useState<number>(280);
  const [newRateInput, setNewRateInput] = useState<string>("280");

  const [copiedAccount, setCopiedAccount] = useState("");

  // Account details
  const easyPaisaNumber = "03151390564";
  const jazzCashNumber = "03133221347";

  // Deposit Requests State
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

  const handleAdminAuth = () => {
    if (isAdmin) {
      setShowAdminPanel(!showAdminPanel);
      return;
    }
    const pin = prompt("Enter Admin PIN Code:");
    if (pin === "786313") {
      setIsAdmin(true);
      setShowAdminPanel(true);
      alert("Admin Mode Activated!");
    } else if (pin) {
      alert("Wrong PIN!");
    }
  };

  const handleCopy = (text: string, label: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedAccount(label);
      setTimeout(() => setCopiedAccount(""), 2000);
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

  const isDark = theme === "dark";

  return (
    <div className={`min-h-screen font-sans ${isDark ? "bg-[#040814] text-white" : "bg-slate-100 text-slate-900"}`}>
      {/* Header */}
      <header className="px-4 py-4 flex justify-between items-center border-b border-slate-800/40">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-xl">
            $
          </div>
          <span className="text-2xl font-black tracking-tight text-white">
            Dollar<span className="text-amber-500">Cash</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Admin Panel Purple Button */}
          <button
            onClick={handleAdminAuth}
            className="px-3 py-1.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1 shadow-lg transition"
          >
            🛡️ Admin Panel
          </button>

          {/* Light/Dark Toggle Button */}
          <button
            onClick={toggleTheme}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 text-xs font-bold flex items-center gap-1"
          >
            ☀️ {isDark ? "Light" : "Dark"}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* Admin Panel View (Only opens with PIN 786313) */}
        {isAdmin && showAdminPanel && (
          <div className="p-4 rounded-2xl border border-amber-500/40 bg-amber-950/10 space-y-4">
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
                      <span>{item.senderName} ({item.senderNumber})</span>
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

        {/* Main Available Balance Card */}
        <div className={`p-5 rounded-3xl border ${isDark ? "bg-[#0b1120] border-slate-800/80" : "bg-white border-slate-200"} space-y-4`}>
          <div>
            <p className="text-xs font-medium text-slate-400">Available Main Balance</p>
            <h1 className="text-4xl font-black text-emerald-400 mt-1">$0.00</h1>
            <p className="text-xs text-slate-500 mt-1">≈ 0.00 PKR (1$ = {dollarRate} PKR)</p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 font-extrabold text-sm text-white flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-900/20 active:scale-95 transition">
              <span>💸</span> Deposit Money
            </button>
            <button className="py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 font-extrabold text-sm text-slate-950 flex items-center justify-center gap-1.5 shadow-lg shadow-amber-900/20 active:scale-95 transition">
              <span>💸</span> Withdraw Cash
            </button>
          </div>
        </div>

        {/* 2x2 Grid Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className={`p-4 rounded-2xl border ${isDark ? "bg-[#0b1120] border-slate-800/80" : "bg-white border-slate-200"}`}>
            <p className="text-xs font-semibold text-slate-400">Total Invested</p>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">$0.00</h3>
          </div>

          <div className={`p-4 rounded-2xl border ${isDark ? "bg-[#0b1120] border-slate-800/80" : "bg-white border-slate-200"}`}>
            <p className="text-xs font-semibold text-slate-400">Total Withdrawn</p>
            <h3 className="text-2xl font-black text-amber-500 mt-1">$0.00</h3>
          </div>

          <div className={`p-4 rounded-2xl border ${isDark ? "bg-[#0b1120] border-slate-800/80" : "bg-white border-slate-200"}`}>
            <p className="text-xs font-semibold text-slate-400">Referral Earnings</p>
            <h3 className="text-2xl font-black text-blue-400 mt-1">$0.00</h3>
          </div>

          <div className={`p-4 rounded-2xl border ${isDark ? "bg-[#0b1120] border-slate-800/80" : "bg-white border-slate-200"}`}>
            <p className="text-xs font-semibold text-slate-400">Active Plan</p>
            <h3 className="text-sm font-bold text-emerald-400 mt-1">No Active Plan</h3>
            <p className="text-[10px] text-slate-500">Time Left: N/A</p>
          </div>
        </div>

        {/* Official Accounts Section */}
        <div className={`p-4 rounded-2xl border ${isDark ? "bg-[#0b1120] border-slate-800/80" : "bg-white border-slate-200"} space-y-3`}>
          <h4 className="text-xs font-bold text-slate-300">Official EasyPaisa Deposit Account</h4>
          <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-sm font-bold text-white tracking-wider">{easyPaisaNumber}</span>
            <button onClick={() => handleCopy(easyPaisaNumber, "ep")} className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold">
              {copiedAccount === "ep" ? "Copied!" : "Copy"}
            </button>
          </div>

          <h4 className="text-xs font-bold text-slate-300 pt-1">Official JazzCash Deposit Account</h4>
          <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-sm font-bold text-white tracking-wider">{jazzCashNumber}</span>
            <button onClick={() => handleCopy(jazzCashNumber, "jc")} className="px-3 py-1 bg-amber-500 text-slate-950 rounded-lg text-xs font-bold">
              {copiedAccount === "jc" ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
