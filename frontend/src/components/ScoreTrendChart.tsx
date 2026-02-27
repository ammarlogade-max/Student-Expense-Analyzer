import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { getScoreHistory } from "../lib/api";

const LEVEL_COLORS: Record<string, string> = {
  Broke: "#ff4d6d",
  Aware: "#ffb930",
  Steady: "#60a5fa",
  Smart: "#00e5c3",
  Legend: "#c8ff00"
};

interface DataPoint {
  date: string;
  score: number;
  level: string;
  label: string;
}

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  const color = LEVEL_COLORS[payload.level] || "#c8ff00";
  return <circle cx={cx} cy={cy} r={4} fill={color} stroke="var(--bg-card)" strokeWidth={2} />;
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as DataPoint;
  const color = LEVEL_COLORS[d.level] || "#c8ff00";
  return (
    <div className="px-3 py-2 rounded-xl text-xs" style={{ background: "var(--bg-card)", border: "1px solid var(--border-hi)", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
      <p className="font-semibold mb-0.5" style={{ color }}>{d.label}</p>
      <p style={{ color: "var(--text)" }}>Score: <strong>{d.score}</strong></p>
      <p style={{ color: "var(--text-muted)" }}>Level: {d.level}</p>
    </div>
  );
};

interface Props {
  days?: 7 | 14 | 30;
}

const ScoreTrendChart = ({ days = 30 }: Props) => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<7 | 14 | 30>(days);

  useEffect(() => {
    setLoading(true);
    getScoreHistory(period)
      .then((res) => {
        const points = res.history.map((h) => ({
          ...h,
          label: new Date(h.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
        }));
        setData(points);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period]);

  const latest = data[data.length - 1]?.score ?? 0;
  const oldest = data[0]?.score ?? 0;
  const trend = latest - oldest;

  return (
    <div className="card p-5 animate-fade-up" style={{ animationDelay: "80ms" }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-sm">Score Trend</h3>
          {data.length > 1 && (
            <p className="text-xs mt-0.5" style={{ color: trend >= 0 ? "var(--lime)" : "var(--rose)" }}>
              {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)} pts over {period} days
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {([7, 14, 30] as const).map((d) => (
            <button
              key={d}
              onClick={() => setPeriod(d)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: period === d ? "rgba(200,255,0,0.1)" : "transparent",
                border: `1px solid ${period === d ? "rgba(200,255,0,0.3)" : "rgba(255,255,255,0.08)"}`,
                color: period === d ? "var(--lime)" : "var(--text-muted)"
              }}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="skeleton h-[160px] rounded-xl" />
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center h-[160px] rounded-xl" style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>
          <div className="text-center">
            <p className="text-2xl mb-2">📊</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Score history appears after your first log
            </p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#c8ff00" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#c8ff00" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={20} stroke="rgba(255,185,48,0.15)" strokeDasharray="4 4" />
            <ReferenceLine y={40} stroke="rgba(96,165,250,0.15)" strokeDasharray="4 4" />
            <ReferenceLine y={60} stroke="rgba(0,229,195,0.15)" strokeDasharray="4 4" />
            <ReferenceLine y={80} stroke="rgba(200,255,0,0.15)" strokeDasharray="4 4" />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#c8ff00"
              strokeWidth={2}
              fill="url(#scoreGrad)"
              dot={<CustomDot />}
              activeDot={{ r: 6, fill: "#c8ff00", stroke: "var(--bg-card)", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}

      <div className="flex flex-wrap gap-2 mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
        {[
          { label: "Broke", color: "#ff4d6d", min: 0 },
          { label: "Aware", color: "#ffb930", min: 20 },
          { label: "Steady", color: "#60a5fa", min: 40 },
          { label: "Smart", color: "#00e5c3", min: 60 },
          { label: "Legend", color: "#c8ff00", min: 80 }
        ].map((lv) => (
          <div key={lv.label} className="flex items-center gap-1">
            <div className="h-1.5 w-3 rounded-full" style={{ background: lv.color }} />
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              {lv.label} {lv.min}+
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScoreTrendChart;
