"use client";

import { useEffect, useState } from "react";
import { CommissionChart, ComparativeChart, FunnelChart } from "@/components/Charts";
import { SkeletonBox } from "@/components/Skeleton";

interface ChartsData {
  timeline: { date: string; revenue: number }[];
  funnel: { registros: number; ftds: number; qftds: number };
  commission: number;
  comparison: {
    receita: { current: number; previous: number };
    registros: { current: number; previous: number };
    ftds: { current: number; previous: number };
    qftds: { current: number; previous: number };
  };
}

interface ChartsSectionProps {
  houseId: string;
  timeframe: string;
  affiliateId: string;
  viewingUserId?: string;
  userId: string;
  showTeamPerformance?: boolean;
}

export default function ChartsSection({ houseId, timeframe, affiliateId, viewingUserId, userId, showTeamPerformance = true }: ChartsSectionProps) {
  const [chartsData, setChartsData] = useState<ChartsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<"receita" | "registros" | "ftds" | "qftds">("receita");

  // Fetch charts data when houseId, timeframe, affiliateId, or showTeamPerformance changes
  useEffect(() => {
    const fetchChartsData = async () => {
      try {
        setLoading(true);
        // When showing team performance, use the affiliate ID as-is (could be "all" or specific user)
        // When showing personal performance, use the specific user ID or logged-in user's ID
        let chartAffiliateId: string;
        if (showTeamPerformance) {
          // Show team: use the current affiliateId (whether "all" or a specific user)
          chartAffiliateId = affiliateId;
        } else {
          // Show personal: if a specific affiliate is selected, use it; otherwise use the logged-in user
          chartAffiliateId = affiliateId !== "all" ? affiliateId : userId;
        }

        const res = await fetch(
          `/api/users/me/charts?houseId=${houseId}&affiliateId=${chartAffiliateId}&timeframe=${timeframe}&includeDescendants=${showTeamPerformance}`
        );
        if (res.ok) {
          const data = await res.json();
          setChartsData(data);
        } else {
          setChartsData(null);
        }
      } catch (err) {
        console.error("Error fetching charts data:", err);
        setChartsData(null);
      } finally {
        setLoading(false);
      }
    };

    if (houseId && houseId !== "default") {
      fetchChartsData();
    }
  }, [houseId, timeframe, affiliateId, userId, showTeamPerformance]);

  return (
    <div className="space-y-4 md:space-y-6">
      {loading || !chartsData ? (
        <>
          <SkeletonBox height="250px" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <SkeletonBox height="250px" />
            <SkeletonBox height="250px" />
          </div>
        </>
      ) : (
        <>
          <CommissionChart data={chartsData.timeline.map((t: { date: string; revenue: number }) => ({ date: t.date, value: t.revenue }))} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <ComparativeChart
              current={chartsData.comparison[selectedMetric].current}
              previous={chartsData.comparison[selectedMetric].previous}
              metric={selectedMetric}
              onMetricChange={setSelectedMetric}
            />
            <FunnelChart
              registros={chartsData.funnel.registros}
              ftds={chartsData.funnel.ftds}
              qftds={chartsData.funnel.qftds}
            />
          </div>
        </>
      )}
    </div>
  );
}
