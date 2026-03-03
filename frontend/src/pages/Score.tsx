import FinanceScoreCard from "../components/FinanceScoreCard";
import ScoreTrendChart from "../components/ScoreTrendChart";

/**
 * /score route — Full Finance Score page
 * Add to your router:
 *   <Route path="/score" element={<Score />} />
 * Add to your nav/sidebar:
 *   { label: "Score", icon: "🏆", path: "/score" }
 */
const Score = () => {
  return (
    <div className="space-y-4 max-w-2xl mx-auto stagger">

      {/* Header */}
      <div className="animate-fade-up">
        <h1 className="text-2xl font-black mb-0.5"
          style={{ fontFamily: "var(--font-display)" }}>
          Finance Score
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Your daily financial health — updated every night
        </p>
      </div>

      {/* Main score card + breakdown + how-it-works */}
      <FinanceScoreCard compact={false} />

      {/* Trend chart */}
      <ScoreTrendChart />

    </div>
  );
};

export default Score;
