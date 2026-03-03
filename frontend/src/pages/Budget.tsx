import { useCallback, useEffect, useMemo, useState } from "react";
import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getBudget, getBudgetStatus, getExpenses, updateBudget } from "../lib/api";
import type { Budget as BudgetData, BudgetStatus } from "../lib/api";
import type { Expense } from "../lib/types";
import { useToast } from "../context/ToastContext";
import { readCache, writeCache } from "../lib/swrCache";

const categories = ["Food","Shopping","Transport","Housing","Education","Entertainment","Health","Other"];

function statusColor(pct: number) { return pct>=90 ? "var(--error)" : pct>=70 ? "var(--warning)" : "var(--success)"; }
function statusLabel(pct: number) { return pct>=90 ? "🔴 Over limit" : pct>=70 ? "🟡 Watch out" : "🟢 On track"; }

const PRESETS = [3000, 5000, 8000, 12000, 15000];

const BudgetPage = () => {
  const { push } = useToast();
  const [budget, setBudget] = useState<BudgetData|null>(null);
  const [status, setStatus] = useState<BudgetStatus|null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [limitInput, setLimitInput] = useState("");
  const [categoryInputs, setCategoryInputs] = useState<Record<string,string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview"|"categories"|"forecast">("overview");

  const loadAll = useCallback(async () => {
    const cacheKey = "budget:overview";
    const cached = readCache<{ budget: BudgetData | null; status: BudgetStatus | null; expenses: Expense[] }>(cacheKey);
    if (cached) {
      setBudget(cached.budget);
      setStatus(cached.status);
      setExpenses(cached.expenses);
      if (cached.budget) {
        setLimitInput(String(cached.budget.monthlyLimit));
        const inp: Record<string,string> = {};
        categories.forEach(c => { inp[c] = String(cached.budget?.categoryBudgets[c] ?? 0); });
        setCategoryInputs(inp);
      }
      setLoading(false);
    } else {
      setLoading(true);
    }
    try {
      const [bRes, sRes, eRes] = await Promise.allSettled([getBudget(), getBudgetStatus(), getExpenses()]);
      if (bRes.status==="fulfilled") {
        setBudget(bRes.value.budget); setLimitInput(String(bRes.value.budget.monthlyLimit));
        const inp: Record<string,string> = {};
        categories.forEach(c => { inp[c] = String(bRes.value.budget.categoryBudgets[c]??0); });
        setCategoryInputs(inp);
      }
      if (sRes.status==="fulfilled") setStatus(sRes.value.status);
      if (eRes.status==="fulfilled") setExpenses(eRes.value.expenses);

      writeCache(cacheKey, {
        budget: bRes.status === "fulfilled" ? bRes.value.budget : cached?.budget ?? null,
        status: sRes.status === "fulfilled" ? sRes.value.status : cached?.status ?? null,
        expenses: eRes.status === "fulfilled" ? eRes.value.expenses : cached?.expenses ?? [],
      });
    } catch { push("Failed to load budget","error"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { loadAll(); }, [loadAll]);

  const saveLimit = async () => {
    const v = Number(limitInput); if (isNaN(v)||v<=0) { push("Budget must be greater than 0","error"); return; }
    setSaving(true);
    try { const res = await updateBudget({ monthlyLimit:v }); setBudget(res.budget); setStatus((await getBudgetStatus()).status); push("Budget saved!","success"); }
    catch { push("Save failed","error"); } finally { setSaving(false); }
  };

  const saveCats = async () => {
    const parsed: Record<string,number> = {};
    Object.entries(categoryInputs).forEach(([k,v]) => { parsed[k] = Math.max(0,Number(v)||0); });
    setSaving(true);
    try { const res = await updateBudget({ categoryBudgets:parsed }); setBudget(res.budget); setStatus((await getBudgetStatus()).status); push("Categories saved!","success"); }
    catch { push("Save failed","error"); } finally { setSaving(false); }
  };

  const { series, forecastTotal } = useMemo(() => {
    const now=new Date(); const y=now.getFullYear(),m=now.getMonth();
    const days=new Date(y,m+1,0).getDate(); const daily=new Array(days).fill(0);
    expenses.forEach(e => { const d=new Date(e.createdAt); if(d.getFullYear()===y&&d.getMonth()===m) daily[d.getDate()-1]+=e.amount; });
    let cum=0; const data=daily.map((v,i) => { cum+=v; return { day:i+1, actual:Number(cum.toFixed(2)) }; });
    const today=now.getDate(); const avg=today?(data[today-1]?.actual??0)/today:0;
    return { series:data.map(p=>({...p,forecast:Number((avg*p.day).toFixed(2))})), forecastTotal:avg*days };
  }, [expenses]);

  const monthlyLimit=budget?.monthlyLimit??0, totalSpent=status?.totalSpent??0, pct=status?.percentUsed??0, remaining=status?.remaining??0;
  const sc = statusColor(pct);

  const tabs = [
    { id:"overview" as const, label:"Setup", icon:<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg> },
    { id:"categories" as const, label:"Categories", icon:<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg> },
    { id:"forecast" as const, label:"Forecast", icon:<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg> },
  ];

  return (
    <div className="space-y-4 stagger">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily:"var(--font-display)", color:"var(--text-primary)" }}>Budget</h1>
        <p className="text-sm" style={{ color:"var(--text-secondary)" }}>Smart spending limits — synced across all your devices</p>
      </div>

      {/* Status hero */}
      <div className="card card-gradient">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color:"var(--text-tertiary)" }}>Monthly Budget</p>
            <p className="text-3xl font-bold" style={{ fontFamily:"var(--font-display)", color:sc }}>
              ₹{monthlyLimit.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="badge text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background:`${sc}18`, color:sc, border:`1px solid ${sc}30` }}>
              {statusLabel(pct)}
            </span>
            <p className="text-xs" style={{ color:"var(--text-tertiary)" }}>₹{totalSpent.toLocaleString("en-IN")} spent</p>
          </div>
        </div>

        <div className="progress-track" style={{ height:8 }}>
          <div className="progress-bar" style={{ width:`${Math.min(pct,100)}%`, background:sc }}/>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs">
          <span style={{ color:"var(--text-tertiary)" }}>{pct.toFixed(1)}% used</span>
          <span style={{ color:remaining<0?"var(--error)":"var(--success)" }}>
            {remaining<0 ? `Over by ₹${Math.abs(remaining).toLocaleString("en-IN")}` : `₹${remaining.toLocaleString("en-IN")} remaining`}
          </span>
        </div>

        {pct >= 70 && (
          <div className="mt-4 rounded-xl px-4 py-3 text-sm" style={{ background:`${sc}10`, border:`1px solid ${sc}25`, color:sc }}>
            {pct>=90 ? "You're very close to your limit — consider pausing large purchases this week." : "You're approaching your budget limit. Keep discretionary spending low."}
          </div>
        )}
      </div>

      {/* Tab switcher */}
      <div className="tab-bar">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`tab-item ${activeTab===tab.id?"active":""}`}>
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Setup tab */}
      {activeTab==="overview" && (
        <div className="card space-y-5">
          <div>
            <h3 className="font-semibold mb-1" style={{ color:"var(--text-primary)" }}>Set Monthly Budget</h3>
            <p className="text-sm" style={{ color:"var(--text-secondary)" }}>Saved to your account — works across all devices.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color:"var(--text-secondary)" }}>Amount (₹)</label>
            <input type="number" min="0" value={limitInput} onChange={e => setLimitInput(e.target.value)} placeholder="e.g. 8000" style={{ fontSize:20, fontWeight:700 }}/>
          </div>
          <div>
            <p className="text-xs mb-2" style={{ color:"var(--text-tertiary)" }}>Quick presets</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map(p => (
                <button key={p} onClick={() => setLimitInput(String(p))}
                  className={`btn-ghost !px-3 !py-2 text-sm ${Number(limitInput)===p ? "!border-[var(--primary)] !text-[var(--primary)]" : ""}`}>
                  ₹{p.toLocaleString("en-IN")}
                </button>
              ))}
            </div>
          </div>
          <button onClick={saveLimit} disabled={saving||loading} className="btn-primary w-full">
            {saving ? "Saving…" : "Save Budget →"}
          </button>
        </div>
      )}

      {/* Categories tab */}
      {activeTab==="categories" && (
        <div className="space-y-3">
          {categories.map(cat => {
            const catStatus=status?.categoryStatus?.[cat];
            const savedLimit=budget?.categoryBudgets?.[cat]??0;
            const spent=status?.spentByCategory?.[cat]??0;
            const catPct=catStatus?.percentUsed??0;
            const cc=statusColor(catPct);
            return (
              <div key={cat} className="card !p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold" style={{ color:"var(--text-primary)" }}>{cat}</span>
                  {savedLimit>0 && <span className="text-xs" style={{ color:"var(--text-tertiary)" }}>₹{spent.toLocaleString("en-IN")} / ₹{savedLimit.toLocaleString("en-IN")}</span>}
                </div>
                {savedLimit>0 && (
                  <div className="progress-track mb-3">
                    <div className="progress-bar" style={{ width:`${Math.min(catPct,100)}%`, background:cc }}/>
                  </div>
                )}
                <input type="number" min="0" value={categoryInputs[cat]??"0"} onChange={e => setCategoryInputs({...categoryInputs,[cat]:e.target.value})}/>
                {catStatus?.isOver && <p className="mt-2 text-xs" style={{ color:"var(--error)" }}>Over budget by ₹{Math.abs(catStatus.remaining).toLocaleString("en-IN")}</p>}
              </div>
            );
          })}
          <button onClick={saveCats} disabled={saving||loading} className="btn-primary w-full sticky bottom-20 lg:static">
            {saving ? "Saving…" : "Save All Categories →"}
          </button>
        </div>
      )}

      {/* Forecast tab */}
      {activeTab==="forecast" && (
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold" style={{ color:"var(--text-primary)" }}>Budget vs Actual</h3>
              <p className="text-xs" style={{ color:"var(--text-secondary)" }}>Forecast based on daily average</p>
            </div>
            <div className="rounded-xl px-3 py-2 text-sm" style={{ background:"var(--bg-tertiary)", border:"1px solid var(--border-light)" }}>
              <span style={{ color:"var(--text-tertiary)" }}>Forecast: </span>
              <span className="font-bold" style={{ color:"var(--text-primary)" }}>₹{forecastTotal.toFixed(0)}</span>
            </div>
          </div>
          {loading ? <div className="skeleton h-56"/> : series.length===0 ? (
            <div className="flex h-56 flex-col items-center justify-center" style={{ border:"1px dashed var(--border-medium)", borderRadius:"var(--radius-lg)" }}>
              <span className="text-3xl mb-2">📊</span>
              <p className="text-sm" style={{ color:"var(--text-secondary)" }}>Add expenses to see forecast</p>
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series} margin={{ top:5,right:10,bottom:5,left:0 }}>
                  <XAxis dataKey="day" stroke="rgba(255,255,255,0.1)" tick={{ fontSize:10, fill:"var(--text-tertiary)" }}/>
                  <YAxis stroke="rgba(255,255,255,0.1)" tick={{ fontSize:10, fill:"var(--text-tertiary)" }} width={50} tickFormatter={v=>`₹${v>=1000?`${(v/1000).toFixed(0)}k`:v}`}/>
                  <Tooltip contentStyle={{ background:"var(--bg-secondary)", border:"1px solid var(--border-medium)", borderRadius:12, color:"var(--text-primary)" }}/>
                  <Line type="monotone" dataKey="actual" stroke="#6366f1" strokeWidth={2.5} dot={false} name="Actual"/>
                  <Line type="monotone" dataKey="forecast" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5 5" dot={false} name="Forecast"/>
                  {monthlyLimit>0 && <ReferenceLine y={monthlyLimit} stroke="#ef4444" strokeDasharray="4 4" label={{ value:"Limit", fill:"#ef4444", fontSize:10 }}/>}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-4 text-xs" style={{ color:"var(--text-tertiary)" }}>
            <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded" style={{ background:"#6366f1" }}/>Actual</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded" style={{ background:"#f59e0b" }}/>Forecast</span>
            {monthlyLimit>0 && <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded" style={{ background:"#ef4444" }}/>Limit</span>}
          </div>
        </div>
      )}
    </div>
  );
};
export default BudgetPage;
