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
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [referralLink, setReferralLink] = useState("");
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [selectedAffiliateCpaLimit, setSelectedAffiliateCpaLimit] = useState<number | null>(null);

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
    }
  }, [selectedHouse, user?.id]);

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

        {/* Team Performance Section */}
        {loading ? (
          <div className="space-y-3">
            <SkeletonLine width="20%" height="1.5rem" />
            <SkeletonBox height="10rem" />
          </div>
        ) : (
          <TeamPerformance
            registros={houseData?.registros || 0}
            ftds={houseData?.ftds || 0}
            qftds={houseData?.qftds || 0}
            comissao="R$ 0,00"
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
