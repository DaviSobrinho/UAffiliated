"use client";

import MainLayout from "@/components/layouts/MainLayout";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ReferralLinkSection from "@/components/team/ReferralLinkSection";
import TeamAgreementCard from "@/components/team/TeamAgreementCard";
import TeamPerformance from "@/components/team/TeamPerformance";
import CommissionStructureInfo from "@/components/team/CommissionStructureInfo";
import AffiliateList from "@/components/team/AffiliateList";
import SubAffiliateCpaModal from "@/components/team/SubAffiliateCpaModal";
import HouseSelector from "@/components/HouseSelector";
import TimeframeSelector from "@/components/TimeframeSelector";
import AffiliateFilter from "@/components/dashboard/AffiliateFilter";
import { useHouse } from "@/context/HouseContext";
import { SkeletonBox, SkeletonLine } from "@/components/Skeleton";
import { useState, useEffect } from "react";

const formatCPA = (value: number | string | null | undefined): string => {
  if (!value) return "R$ 0,00";
  const num = typeof value === "string" ? Number.parseFloat(value) : value;
  return `R$ ${num.toFixed(2).replace(".", ",")}`;
};

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface UserHouseData {
  id: string;
  houseId: string;
  houseName: string;
  cpa: number;
  affiliateLink: string;
  registros: number;
  ftds: number;
  qftds: number;
}

interface Affiliate {
  id: string;
  name: string;
  email: string;
  commission: string;
  linkedDate: string;
  cpa: number | null;
  cpaEditedOnce: boolean;
}

export default function TeamPage() {
  const { selectedHouse } = useHouse();
  const [user, setUser] = useState<User | null>(null);
  const [houseData, setHouseData] = useState<UserHouseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [teamLoading, setTeamLoading] = useState(false);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [referralLink, setReferralLink] = useState("");
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [selectedAffiliateCpaLimit, setSelectedAffiliateCpaLimit] = useState<number | null>(null);
  const [timeframe, setTimeframe] = useState("7d");
  const [selectedAffiliateId, setSelectedAffiliateId] = useState("all");
  const [teamRegistros, setTeamRegistros] = useState(0);
  const [teamFtds, setTeamFtds] = useState(0);
  const [teamQftds, setTeamQftds] = useState(0);
  const [teamComissao, setTeamComissao] = useState("R$ 0,00");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      if (globalThis.window !== undefined) {
        setReferralLink(`${globalThis.window.location.origin}/register?ref=${parsedUser.id}`);
      }
    }
  }, []);

  useEffect(() => {
    if (selectedHouse && user?.id) {
      fetchHouseData();
      fetchTeamPerformance();
    }
  }, [selectedHouse, user?.id, timeframe, selectedAffiliateId]);

  const fetchHouseData = async () => {
    try {
      setLoading(true);
      const [houseDataRes, teamRes] = await Promise.all([
        fetch(`/api/users/me/house-data?houseId=${selectedHouse}`),
        fetch(`/api/users/me/team?houseId=${selectedHouse}`),
      ]);

      if (houseDataRes.ok) {
        const data = await houseDataRes.json();
        setHouseData(data.houseData);
      } else {
        setHouseData(null);
      }

      if (teamRes.ok) {
        const data = await teamRes.json();
        setAffiliates(data.affiliates || []);
      } else {
        setAffiliates([]);
      }
    } catch (err) {
      console.error("Error fetching house data:", err);
      setHouseData(null);
      setAffiliates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSetCpa = (affiliate: Affiliate, cpaLimit: number | null) => {
    setSelectedAffiliate(affiliate);
    setSelectedAffiliateCpaLimit(cpaLimit);
  };

  const handleCpaModalClose = () => {
    setSelectedAffiliate(null);
  };

  const handleCpaUpdated = () => {
    fetchHouseData();
  };

  const fetchTeamPerformance = async () => {
    try {
      setTeamLoading(true);
      const res = await fetch(
        `/api/users/me/charts?houseId=${selectedHouse}&affiliateId=${selectedAffiliateId}&timeframe=${timeframe}`
      );
      if (res.ok) {
        const data = await res.json();
        setTeamRegistros(data.funnel.registros);
        setTeamFtds(data.funnel.ftds);
        setTeamQftds(data.funnel.qftds);
        setTeamComissao(formatCPA(data.commission));
      } else {
        setTeamRegistros(0);
        setTeamFtds(0);
        setTeamQftds(0);
        setTeamComissao("R$ 0,00");
      }
    } catch (err) {
      console.error("Error fetching team performance:", err);
      setTeamRegistros(0);
      setTeamFtds(0);
      setTeamQftds(0);
      setTeamComissao("R$ 0,00");
    } finally {
      setTeamLoading(false);
    }
  };


  return (
    <MainLayout>
      <DashboardHeader title="Minha Equipe" subtitle="Gerencie os afiliados da sua equipe" />

      <div className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
        {/* Referral Link Section */}
        {referralLink && <ReferralLinkSection referralLink={referralLink} />}

        {/* Team Agreement Card */}
        {loading ? (
          <div className="space-y-3">
            <SkeletonLine width="20%" height="1.5rem" />
            <SkeletonBox height="6rem" />
          </div>
        ) : (
          <TeamAgreementCard cpa={formatCPA(houseData?.cpa)} />
        )}

        {/* Team Performance Filters */}
        {!loading && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-full sm:w-64">
              <TimeframeSelector value={timeframe} onChange={setTimeframe} />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-zinc-400 whitespace-nowrap">Filtrar por:</span>
              <div className="w-full sm:w-64">
                <AffiliateFilter
                  houseId={selectedHouse}
                  value={selectedAffiliateId}
                  onChange={setSelectedAffiliateId}
                  affiliates={affiliates}
                />
              </div>
            </div>
          </div>
        )}

        {/* Team Performance Section */}
        {teamLoading ? (
          <div className="space-y-3">
            <SkeletonLine width="20%" height="1.5rem" />
            <SkeletonBox height="10rem" />
          </div>
        ) : (
          <TeamPerformance
            registros={teamRegistros}
            ftds={teamFtds}
            qftds={teamQftds}
            comissao={teamComissao}
          />
        )}

        {/* Commission Structure Info */}
        <CommissionStructureInfo />

        {/* House Selector */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg md:text-xl font-bold text-white">Casa:</h3>
          <div className="w-full md:w-64 ml-4">
            <HouseSelector />
          </div>
        </div>

        {/* Affiliate List */}
        <AffiliateList affiliates={affiliates} houseId={selectedHouse} parentCpa={houseData?.cpa || null} onSetCpa={handleSetCpa} />
      </div>

      {/* CPA Modal */}
      <SubAffiliateCpaModal
        affiliate={selectedAffiliate}
        parentCpa={selectedAffiliateCpaLimit}
        houseId={selectedHouse}
        onClose={handleCpaModalClose}
        onUpdated={handleCpaUpdated}
      />
    </MainLayout>
  );
}
