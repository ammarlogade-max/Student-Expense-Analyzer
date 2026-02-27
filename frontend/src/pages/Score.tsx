import FinanceScoreCard from "../components/FinanceScoreCard";
import ScoreTrendChart from "../components/ScoreTrendChart";

const Score = () => {
  return (
    <div className="space-y-4 max-w-2xl mx-auto stagger">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-black mb-0.5" style={{ fontFamily: "var(--font-display)" }}>
          Finance Score
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Your daily financial health - updated every night
        </p>
      </div>

      <FinanceScoreCard compact={false} />
      <ScoreTrendChart />
    </div>
  );
};

export default Score;
