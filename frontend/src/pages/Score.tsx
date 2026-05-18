import FinanceScoreCard from "../components/FinanceScoreCard";
import ScoreTrendChart from "../components/ScoreTrendChart";
import { useNavigate } from "react-router-dom";

const scoreTips = [
  "Log expenses daily to improve consistency score.",
  "Avoid overspending in one category frequently.",
  "Maintain steady monthly spending habits.",
  "Track cash expenses regularly for better accuracy.",
];

const Score = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-5 pb-24 max-w-4xl mx-auto stagger">
      <div>
        <h1
          className="text-2xl font-bold"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--text-primary)",
          }}
        >
          Finance Score
        </h1>

        <p
          className="text-sm mt-1"
          style={{ color: "var(--text-secondary)" }}
        >
          Understand your financial behavior and score trends.
        </p>
      </div>

      <FinanceScoreCard compact={false} />

      <div className="card">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div>
            <h2
              className="text-base font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Score Trends
            </h2>

            <p
              className="text-xs mt-1"
              style={{ color: "var(--text-tertiary)" }}
            >
              Track how your score changes over time.
            </p>
          </div>

          <button
            onClick={() => navigate("/analytics")}
            className="text-xs font-semibold"
            style={{ color: "var(--primary)" }}
          >
            Open Analytics
          </button>
        </div>

        <ScoreTrendChart />
      </div>

      <div className="card">
        <h2
          className="text-base font-semibold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Improve Your Score
        </h2>

        <div className="space-y-3">
          {scoreTips.map((tip) => (
            <div
              key={tip}
              className="rounded-2xl p-4"
              style={{
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border-light)",
              }}
            >
              <p
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                {tip}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Score;
