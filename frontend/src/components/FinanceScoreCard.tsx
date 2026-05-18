import { useCallback, useEffect, useState } from "react";
import { getFinanceScore, recalculateScore } from "../lib/api";
import type { ScoreResponse } from "../lib/api";

function ScoreRing({
  score,
  color,
  size = 140,
}: {
  score: number;
  color: string;
  size?: number;
}) {
  const radius = (size - 20) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={10}
      />

      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
    </svg>
  );
}

function ScoreBreakdownItem({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: string;
}) {
  const percent = Math.min((value / 25) * 100, 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span>{icon}</span>
          <span style={{ color: "var(--text-primary)" }}>{label}</span>
        </div>

        <span className="text-xs font-semibold" style={{ color }}>
          {value}/25
        </span>
      </div>

      <div className="progress-track">
        <div
          className="progress-bar"
          style={{ width: `${percent}%`, background: color }}
        />
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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadScore = useCallback(async (forceRefresh = false) => {
    try {
      setError("");

      const response = forceRefresh
        ? await recalculateScore()
        : await getFinanceScore();

      setData(response);
      setLastUpdated(new Date());
    } catch {
      setError("Unable to load finance score");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadScore();
  }, [loadScore]);

  const refreshScore = async () => {
    setRefreshing(true);
    await loadScore(true);
  };

  if (loading) {
    return (
      <div className="card">
        <div className="skeleton h-[180px]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card text-center space-y-4">
        <p className="text-sm" style={{ color: "var(--error)" }}>
          {error}
        </p>

        <button onClick={() => loadScore()} className="btn-secondary">
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { score } = data;

  if (compact) {
    return (
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <ScoreRing
              score={score.totalScore}
              color={score.levelColor}
              size={76}
            />

            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="text-lg font-bold"
                style={{ color: score.levelColor }}
              >
                {score.totalScore}
              </span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3
                className="text-base font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {score.level}
              </h3>

              {score.weeklyDelta !== 0 && (
                <span
                  className="text-xs font-semibold"
                  style={{
                    color:
                      score.weeklyDelta > 0
                        ? "var(--success)"
                        : "var(--error)",
                  }}
                >
                  {score.weeklyDelta > 0 ? "+" : ""}
                  {score.weeklyDelta}
                </span>
              )}
            </div>

            <p
              className="text-xs mt-1 truncate"
              style={{ color: "var(--text-tertiary)" }}
            >
              {score.insight}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card card-gradient">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <div className="relative shrink-0">
            <ScoreRing
              score={score.totalScore}
              color={score.levelColor}
              size={150}
            />

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="text-4xl font-bold"
                style={{ color: score.levelColor }}
              >
                {score.totalScore}
              </span>

              <span
                className="text-xs mt-1"
                style={{ color: "var(--text-tertiary)" }}
              >
                /100
              </span>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="text-3xl">{score.levelEmoji}</span>

              <h2
                className="text-2xl font-bold"
                style={{ color: score.levelColor }}
              >
                {score.level}
              </h2>
            </div>

            <p
              className="text-sm mt-4 rounded-2xl p-4"
              style={{
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border-light)",
                color: "var(--text-secondary)",
              }}
            >
              {score.insight}
            </p>

            {lastUpdated && (
              <p
                className="text-xs mt-3"
                style={{ color: "var(--text-tertiary)" }}
              >
                Updated at {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h3
            className="text-base font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Score Breakdown
          </h3>

          <span
            className="text-xs"
            style={{ color: "var(--text-tertiary)" }}
          >
            Each out of 25
          </span>
        </div>

        <div className="space-y-4">
          <ScoreBreakdownItem
            label="Consistency"
            value={score.consistencyScore}
            color="#6366f1"
            icon="📅"
          />

          <ScoreBreakdownItem
            label="Budget"
            value={score.budgetScore}
            color="#14b8a6"
            icon="💰"
          />

          <ScoreBreakdownItem
            label="Cash"
            value={score.cashScore}
            color="#3b82f6"
            icon="💵"
          />

          <ScoreBreakdownItem
            label="Savings"
            value={score.savingsScore}
            color="#ec4899"
            icon="📈"
          />
        </div>
      </div>

      <button
        onClick={refreshScore}
        disabled={refreshing}
        className="btn-secondary w-full"
      >
        {refreshing ? "Refreshing score..." : "Refresh Score"}
      </button>
    </div>
  );
};

export default FinanceScoreCard;
