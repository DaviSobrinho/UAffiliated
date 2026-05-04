"use client";

import { useEffect, useState } from "react";
import { CommissionChart, ComparativeChart, FunnelChart } from "@/components/Charts";
import { SkeletonBox } from "@/components/Skeleton";

interface ChartsData {
  timeline: { date: string; revenue: number }[];
  funnel: { registros: number; ftds: number; qftds: number };
  commission: number;
  comparison: { current: number; previous: number };
}

interface ChartsSectionProps {
  houseId: string;
  timeframe: string;
  affiliateId: string;
  viewingUserId?: string;
}

export default function ChartsSection({ houseId, timeframe, affiliateId, viewingUserId }: ChartsSectionProps) {
  const [chartsData, setChartsData] = useState<ChartsData | null>(null);
  const [loading, setLoading] = useState(false);

  // Determine which affiliateId to use for the API call
  const effectiveAffiliateId = viewingUserId || affiliateId;

  // Fetch charts data when houseId, timeframe, or affiliateId changes
  useEffect(() => {
    const fetchChartsData = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/users/me/charts?houseId=${houseId}&affiliateId=${effectiveAffiliateId}&timeframe=${timeframe}`
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

    if (houseId) {
      fetchChartsData();
    }
  }, [houseId, timeframe, effectiveAffiliateId]);

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
          <CommissionChart data={chartsData.timeline.map((t: any) => ({ date: t.date, value: t.revenue }))} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <ComparativeChart
              current={chartsData.comparison.current}
              previous={chartsData.comparison.previous}
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
