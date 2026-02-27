import { useEffect, useState } from "react";
import { getFinanceScore, recalculateScore } from "../lib/api";
import type { ScoreResponse } from "../lib/api";

function ScoreRing({
  score,
  color,
  size = 140
}: {
  score: number;
  color: string;
  size?: number;
}) {
  const r = (size - 20) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const dashOffset = circ - (score / 100) * circ;

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={dashOffset}
        style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }}
      />
    </svg>
  );
}

function SubBar({
  label,
  value,
  max = 25,
  color,
  icon
}: {
  label: string;
  value: number;
  max?: number;
  color: string;
  icon: string;
}) {
  const pct = Math.round((value / max) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          <span>{icon}</span> {label}
        </span>
        <span className="text-xs font-bold tabular-nums" style={{ color }}>
          {value}/{max}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

interface Props {
  compact?: boolean;
}

const FinanceScoreCard = ({ compact = false }: Props) => {
  const [data, setData] = useState<ScoreResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [recalcing, setRecalcing] = useState(false);

  useEffect(() => {
    getFinanceScore()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleRecalc = async () => {
    setRecalcing(true);
    try {
      const fresh = await recalculateScore();
      setData(fresh);
    } finally {
      setRecalcing(false);
    }
  };

  if (loading) {
    return (
      <div className="card p-5 animate-fade-up">
        <div className="skeleton h-[180px] rounded-xl" />
      </div>
    );
  }

  if (!data) return null;

  const { score, progressToNext, nextLevel, nextLevelEmoji } = data;
  const scoreColor = score.levelColor;

  if (compact) {
    return (
      <div className="card p-5 animate-fade-up" style={{ background: "rgba(255,255,255,0.025)" }}>
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <ScoreRing score={score.totalScore} color={scoreColor} size={80} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-black leading-none" style={{ fontFamily: "var(--font-display)", color: scoreColor }}>
                {score.totalScore}
              </span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-base">{score.levelEmoji}</span>
              <span className="font-bold text-sm">{score.level}</span>
              {score.streak > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-md font-bold" style={{ background: "rgba(255,185,48,0.15)", color: "#ffb930" }}>
                  🔥 {score.streak}d
                </span>
              )}
              {score.weeklyDelta !== 0 && (
                <span className="text-xs font-bold ml-auto" style={{ color: score.weeklyDelta > 0 ? "var(--lime)" : "var(--rose)" }}>
                  {score.weeklyDelta > 0 ? "▲" : "▼"} {Math.abs(score.weeklyDelta)}
                </span>
              )}
            </div>
            <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
              {score.insight}
            </p>
            {nextLevel && (
              <div>
                <div className="flex justify-between text-[10px] mb-1" style={{ color: "var(--text-muted)" }}>
                  <span>Progress to {nextLevelEmoji} {nextLevel}</span>
                  <span>{progressToNext}%</span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${progressToNext}%`, background: scoreColor }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card p-6 animate-fade-up">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative flex-shrink-0">
            <ScoreRing score={score.totalScore} color={scoreColor} size={160} />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
              <span className="text-4xl font-black leading-none" style={{ fontFamily: "var(--font-display)", color: scoreColor }}>
                {score.totalScore}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>/ 100</span>
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <span className="text-3xl">{score.levelEmoji}</span>
              <h2 className="text-2xl font-black" style={{ fontFamily: "var(--font-display)", color: scoreColor }}>
                {score.level}
              </h2>
            </div>

            <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start mb-3">
              {data.levels.map((lv) => (
                <span
                  key={lv.name}
                  className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{
                    background: lv.name === score.level ? `${lv.color}20` : "rgba(255,255,255,0.04)",
                    border: `1px solid ${lv.name === score.level ? lv.color : "rgba(255,255,255,0.08)"}`,
                    color: lv.name === score.level ? lv.color : "var(--text-muted)"
                  }}
                >
                  {lv.emoji} {lv.name}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-3 mb-3">
              {score.streak > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: "rgba(255,185,48,0.1)", border: "1px solid rgba(255,185,48,0.25)" }}>
                  <span>🔥</span>
                  <span className="text-sm font-bold" style={{ color: "#ffb930" }}>
                    {score.streak}-day streak
                  </span>
                </div>
              )}
              {score.weeklyDelta !== 0 && (
                <div
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl"
                  style={{
                    background: score.weeklyDelta > 0 ? "rgba(200,255,0,0.08)" : "rgba(255,77,109,0.08)",
                    border: `1px solid ${score.weeklyDelta > 0 ? "rgba(200,255,0,0.2)" : "rgba(255,77,109,0.2)"}`
                  }}
                >
                  <span className="text-sm font-bold" style={{ color: score.weeklyDelta > 0 ? "var(--lime)" : "var(--rose)" }}>
                    {score.weeklyDelta > 0 ? "▲" : "▼"} {Math.abs(score.weeklyDelta)} pts this week
                  </span>
                </div>
              )}
            </div>

            <p
              className="text-sm px-3 py-2 rounded-xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text-muted)" }}
            >
              {score.insight}
            </p>
          </div>
        </div>

        {nextLevel && (
          <div className="mt-5 pt-5" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="flex justify-between text-xs mb-2" style={{ color: "var(--text-muted)" }}>
              <span>Progress to {nextLevelEmoji} <strong style={{ color: "var(--text)" }}>{nextLevel}</strong></span>
              <span className="font-bold" style={{ color: scoreColor }}>{progressToNext}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${progressToNext}%`, background: scoreColor }} />
            </div>
          </div>
        )}
      </div>

      <div className="card p-5 animate-fade-up" style={{ animationDelay: "60ms" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Score Breakdown
          </h3>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Each out of 25</span>
        </div>
        <div className="space-y-4">
          <SubBar label="Consistency" value={score.consistencyScore} color="#c8ff00" icon="📅" />
          <SubBar label="Budget Discipline" value={score.budgetScore} color="#00e5c3" icon="💰" />
          <SubBar label="Cash Hygiene" value={score.cashScore} color="#60a5fa" icon="💸" />
          <SubBar label="Savings Trend" value={score.savingsScore} color="#a78bfa" icon="📉" />
        </div>
      </div>

      <div className="card p-5 animate-fade-up" style={{ animationDelay: "120ms" }}>
        <h3 className="font-bold text-sm uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
          How it works
        </h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { icon: "📅", title: "Consistency (25pts)", desc: "Log at least once daily. Streaks give bonus points." },
            { icon: "💰", title: "Budget (25pts)", desc: "Stay under your monthly budget. Set one in Budget tab." },
            { icon: "💸", title: "Cash Hygiene (25pts)", desc: "Resolve cash alerts and keep your wallet topped up." },
            { icon: "📉", title: "Savings (25pts)", desc: "Spend less this week than last week." }
          ].map((item) => (
            <div key={item.title} className="flex gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              <div>
                <p className="text-xs font-bold mb-0.5">{item.title}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={handleRecalc} disabled={recalcing} className="btn-ghost w-full py-3 text-sm">
        {recalcing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity=".25" />
              <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            Recalculating...
          </span>
        ) : "↻ Refresh Score"}
      </button>
    </div>
  );
};

export default FinanceScoreCard;
