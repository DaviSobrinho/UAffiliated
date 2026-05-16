"use client";

import MainLayout from "@/components/layouts/MainLayout";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import BalanceCard from "@/components/cards/BalanceCard";
import MinhaPerformance from "@/components/dashboard/MinhaPerformance";
import PerformanceEquipe from "@/components/dashboard/PerformanceEquipe";
import TotalPerformance from "@/components/dashboard/TotalPerformance";
import ChartsSection from "@/components/dashboard/ChartsSection";
import InfoBox from "@/components/dashboard/InfoBox";
import TimeframeSelector from "@/components/TimeframeSelector";
import AffiliateLinksSection from "@/components/dashboard/AffiliateLinksSection";
import AffiliateFilter from "@/components/dashboard/AffiliateFilter";
import { useHouse } from "@/context/HouseContext";
import { useBalance } from "@/context/BalanceContext";
import { SkeletonBox, SkeletonLine } from "@/components/Skeleton";
import ReferralDialog from "@/components/dashboard/ReferralDialog";
import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";

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

const formatCPA = (value: number | string | null | undefined): string => {
    if (!value) return "R$ 0,00";
    const num = typeof value === "string" ? parseFloat(value) : value;
    return `R$ ${num.toFixed(2).replace(".", ",")}`;
};

export default function DashboardPage() {
    const { selectedHouse } = useHouse();
    const { balance, refreshBalance } = useBalance();
    const [user, setUser] = useState<User | null>(null);
    const [viewingUser] = useState<{ id: string; name: string } | null>(null);
    const [timeframe, setTimeframe] = useState("7d");
    const [selectedAffiliateId, setSelectedAffiliateId] = useState("all");
    const [selectedAffiliateName, setSelectedAffiliateName] = useState<string | null>(null);
    const [displayName, setDisplayName] = useState<string>("Carregando...");
    const [selectedAffiliateCpa, setSelectedAffiliateCpa] = useState<number | null>(null);
    const [houseData, setHouseData] = useState<UserHouseData | null>(null);
    const [loading, setLoading] = useState(false);
    const [myPerformanceLoading, setMyPerformanceLoading] = useState(false);
    const [myRegistros, setMyRegistros] = useState(0);
    const [myFtds, setMyFtds] = useState(0);
    const [myQftds, setMyQftds] = useState(0);
    const [teamRegistros, setTeamRegistros] = useState(0);
    const [teamFtds, setTeamFtds] = useState(0);
    const [teamQftds, setTeamQftds] = useState(0);
    const [meuRev, setMeuRev] = useState("R$ 0,00");
    const [comissaoEquipe, setComissaoEquipe] = useState("R$ 0,00");
    const [totalProprio, setTotalProprio] = useState("R$ 0,00");
    const [hasReferrer, setHasReferrer] = useState(true);
    const [showReferralDialog, setShowReferralDialog] = useState(false);
    const [refreshCooldown, setRefreshCooldown] = useState(0);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            setDisplayName(userData.name);
        }
    }, []);

    useEffect(() => {
        if (!hasReferrer && user?.role !== "ADMIN") {
            setShowReferralDialog(true);
        }
    }, [hasReferrer, user?.role]);

    useEffect(() => {
        if (selectedHouse && selectedHouse !== "default" && user?.id) {
            // Reset affiliate filter when viewing a different user
            setSelectedAffiliateId("all");
            fetchHouseData();
            // Also refresh balance when house changes
            refreshBalance(selectedHouse);
        }
    }, [selectedHouse, user?.id, timeframe, viewingUser, refreshBalance]);

    useEffect(() => {
        if (refreshCooldown > 0) {
            const timer = setTimeout(() => setRefreshCooldown(prev => prev - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [refreshCooldown]);

    const handleRefresh = async () => {
        if (refreshCooldown > 0) return;

        setRefreshCooldown(10);
        await Promise.all([
            fetchHouseData(),
            selectedAffiliateId !== "all" ? fetchSelectedAffiliateData() : fetchMyPerformance(),
        ]);
    };

    useEffect(() => {
        if (selectedHouse && user?.id) {
            if (selectedAffiliateId !== "all") {
                fetchSelectedAffiliateData();
            } else {
                if (houseData) {
                    fetchMyPerformance();
                }
            }
        }
    }, [selectedHouse, user?.id, selectedAffiliateId, timeframe]);

    const fetchMyPerformance = async () => {
        try {
            setMyPerformanceLoading(true);

            const res = await fetch(
                `/api/users/me/dashboard?houseId=${selectedHouse}&timeframe=${timeframe}`
            );

            if (res.ok) {
                const data = await res.json();
                setMyRegistros(data.periodStats.registros);
                setMyFtds(data.periodStats.ftds);
                setMyQftds(data.periodStats.qftds);
                setTeamRegistros(data.teamStats.registros);
                setTeamFtds(data.teamStats.ftds);
                setTeamQftds(data.teamStats.qftds);
                setMeuRev(formatCPA(data.performance.meuRev));
                setComissaoEquipe(formatCPA(data.performance.comissaoEquipe));
                setTotalProprio(formatCPA(data.performance.totalProprio));
            } else {
                setMyRegistros(0);
                setMyFtds(0);
                setMyQftds(0);
                setTeamRegistros(0);
                setTeamFtds(0);
                setTeamQftds(0);
                setMeuRev("R$ 0,00");
                setComissaoEquipe("R$ 0,00");
                setTotalProprio("R$ 0,00");
            }
        } catch (err) {
            console.error("Error fetching my performance:", err);
            setMyRegistros(0);
            setMyFtds(0);
            setMyQftds(0);
            setTeamRegistros(0);
            setTeamFtds(0);
            setTeamQftds(0);
            setMeuRev("R$ 0,00");
            setComissaoEquipe("R$ 0,00");
            setTotalProprio("R$ 0,00");
        } finally {
            setMyPerformanceLoading(false);
        }
    };

    const fetchSelectedAffiliateData = async () => {
        try {
            setMyPerformanceLoading(true);

            const res = await fetch(
                `/api/users/${selectedAffiliateId}/dashboard?houseId=${selectedHouse}&timeframe=${timeframe}`
            );

            if (res.ok) {
                const data = await res.json();
                setSelectedAffiliateName(data.user.name);
                setMyRegistros(data.periodStats.registros);
                setMyFtds(data.periodStats.ftds);
                setMyQftds(data.periodStats.qftds);
                setTeamRegistros(data.teamStats.registros);
                setTeamFtds(data.teamStats.ftds);
                setTeamQftds(data.teamStats.qftds);
                setSelectedAffiliateCpa(Number(data.houseData.cpa));
                setMeuRev(formatCPA(data.performance.meuRev));
                setComissaoEquipe(formatCPA(data.performance.comissaoEquipe));
                setTotalProprio(formatCPA(data.performance.totalProprio));
            } else {
                console.error("Error fetching affiliate data:", res.status);
                setMyRegistros(0);
                setMyFtds(0);
                setMyQftds(0);
                setTeamRegistros(0);
                setTeamFtds(0);
                setTeamQftds(0);
                setSelectedAffiliateCpa(null);
                setMeuRev("R$ 0,00");
                setComissaoEquipe("R$ 0,00");
                setTotalProprio("R$ 0,00");
                setSelectedAffiliateName(null);
            }
        } catch (err) {
            console.error("Error fetching selected affiliate data:", err);
            setMyRegistros(0);
            setMyFtds(0);
            setMyQftds(0);
            setTeamRegistros(0);
            setTeamFtds(0);
            setTeamQftds(0);
            setSelectedAffiliateCpa(null);
            setMeuRev("R$ 0,00");
            setComissaoEquipe("R$ 0,00");
            setTotalProprio("R$ 0,00");
            setSelectedAffiliateName(null);
        } finally {
            setMyPerformanceLoading(false);
        }
    };


    const fetchHouseData = async () => {
        try {
            setLoading(true);

            if (viewingUser) {
                // Fetch data for the viewing user
                const viewAsRes = await fetch(
                    `/api/users/view-as/${viewingUser.id}?houseId=${selectedHouse}&timeframe=${timeframe}`
                );

                if (viewAsRes.ok) {
                    const data = await viewAsRes.json();
                    setHouseData(data.houseData);
                    setMyRegistros(data.periodStats.registros);
                    setMyFtds(data.periodStats.ftds);
                    setMyQftds(data.periodStats.qftds);
                    setTeamRegistros(data.teamStats.registros);
                    setTeamFtds(data.teamStats.ftds);
                    setTeamQftds(data.teamStats.qftds);
                    setMeuRev(formatCPA(data.performance.meuRev));
                    setComissaoEquipe(formatCPA(data.performance.comissaoEquipe));
                    setTotalProprio(formatCPA(data.performance.totalProprio));

                    if (selectedHouse) {
                        await refreshBalance(selectedHouse);
                    }
                } else {
                    setHouseData(null);
                    setMyRegistros(0);
                    setMyFtds(0);
                    setMyQftds(0);
                    setTeamRegistros(0);
                    setTeamFtds(0);
                    setTeamQftds(0);
                    setMeuRev("R$ 0,00");
                    setComissaoEquipe("R$ 0,00");
                    setTotalProprio("R$ 0,00");
                }
            } else {
                // Fetch data for the logged-in user
                const [dashboardRes, userRes] = await Promise.all([
                    fetch(`/api/users/me/dashboard?houseId=${selectedHouse}&timeframe=${timeframe}`),
                    fetch(`/api/users/me`),
                ]);

                if (dashboardRes.ok) {
                    const data = await dashboardRes.json();
                    setHouseData(data.houseData);
                    setMyRegistros(data.periodStats.registros);
                    setMyFtds(data.periodStats.ftds);
                    setMyQftds(data.periodStats.qftds);
                    setTeamRegistros(data.teamStats.registros);
                    setTeamFtds(data.teamStats.ftds);
                    setTeamQftds(data.teamStats.qftds);
                    setMeuRev(formatCPA(data.performance.meuRev));
                    setComissaoEquipe(formatCPA(data.performance.comissaoEquipe));
                    setTotalProprio(formatCPA(data.performance.totalProprio));

                    if (selectedHouse) {
                        await refreshBalance(selectedHouse);
                    }
                } else {
                    setHouseData(null);
                    setMyRegistros(0);
                    setMyFtds(0);
                    setMyQftds(0);
                    setTeamRegistros(0);
                    setTeamFtds(0);
                    setTeamQftds(0);
                    setMeuRev("R$ 0,00");
                    setComissaoEquipe("R$ 0,00");
                    setTotalProprio("R$ 0,00");
                }

                if (userRes.ok) {
                    const userData = await userRes.json();
                    setHasReferrer(userData.affiliateParentId !== null);
                }
            }
        } catch (err) {
            console.error("Error fetching house data:", err);
            setHouseData(null);
            setMyRegistros(0);
            setMyFtds(0);
            setMyQftds(0);
            setTeamRegistros(0);
            setTeamFtds(0);
            setTeamQftds(0);
            setMeuRev("R$ 0,00");
            setComissaoEquipe("R$ 0,00");
            setTotalProprio("R$ 0,00");
        } finally {
            setLoading(false);
        }
    };


    return (
        <MainLayout>
            <DashboardHeader title="Dashboard" subtitle={user ? `Bem-vindo, ${user.name}!` : "Bem-vindo!"} />

            <div className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
                {/* Affiliate Links Section */}
                {loading ? (
                    <div className="space-y-2">
                        <SkeletonLine width="15%" height="1rem" />
                        <SkeletonBox height="3rem" />
                    </div>
                ) : (
                    <AffiliateLinksSection affiliateLink={houseData?.affiliateLink || ""} />
                )}

                {/* Balance Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {loading ? (
                        <>
                            <SkeletonBox height="8rem" />
                            <SkeletonBox height="8rem" />
                        </>
                    ) : (
                        <>
                            <BalanceCard
                                title="Seu saldo disponível"
                                amount={balance}
                                subtitle="Disponível para saque"
                                variant="primary"
                            />
                            <BalanceCard
                                title="Total em Saques"
                                amount="R$ 0,00"
                                subtitle="Saques aprovados"
                                variant="secondary"
                            />
                        </>
                    )}
                </div>

                {/* My Performance Section Header with Filters */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                        {/* Título + Subtítulo */}
                        <div className="flex flex-col">
                            <h2 className="text-lg md:text-xl font-bold text-white">
                                {selectedAffiliateId !== "all" && selectedAffiliateName
                                    ? `Performance de ${selectedAffiliateName}`
                                    : "Minha Performance"}
                            </h2>
                            <p className="text-zinc-500 text-xs md:text-sm">
                                {selectedAffiliateId !== "all"
                                    ? "Resultados diretos deste afiliado"
                                    : "Resultados que eu trouxe diretamente"}
                            </p>
                        </div>

                        {/* Ações */}
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-end">
                            <button
                                onClick={handleRefresh}
                                disabled={refreshCooldown > 0}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-sm hover:bg-zinc-800 transition disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                            >
                                <RotateCcw size={16} className={refreshCooldown > 0 ? "animate-spin" : ""} />
                                {refreshCooldown > 0 ? `${refreshCooldown}s` : "Atualizar"}
                            </button>

                            {!viewingUser && (
                                <div className="w-full sm:flex-1 sm:max-w-xs">
                                    <AffiliateFilter
                                        houseId={selectedHouse}
                                        value={selectedAffiliateId}
                                        onChange={setSelectedAffiliateId}
                                        currentUserName={displayName}
                                    />
                                </div>
                            )}

                            <div className="w-full sm:flex-1 sm:max-w-xs">
                                <TimeframeSelector value={timeframe} onChange={setTimeframe} />
                            </div>
                        </div>

                    </div>

                    {/* My Performance Section */}
                    {loading || myPerformanceLoading ? (
                        <div className="space-y-3">
                            <SkeletonLine width="20%" height="1.5rem" />
                            <SkeletonBox height="10rem" />
                        </div>
                    ) : (
                        <>
                            <MinhaPerformance
                                registros={myRegistros}
                                ftds={myFtds}
                                qftds={myQftds}
                                cpa={formatCPA(selectedAffiliateCpa !== null ? selectedAffiliateCpa : houseData?.cpa || 0)}
                                reu={meuRev}
                            />

                            <PerformanceEquipe
                                registros={teamRegistros}
                                ftds={teamFtds}
                                qftds={teamQftds}
                                comissaoEquipe={comissaoEquipe}
                                userName={selectedAffiliateName || displayName}
                            />

                            <TotalPerformance
                                registros={myRegistros + teamRegistros}
                                ftds={myFtds + teamFtds}
                                qftds={myQftds + teamQftds}
                                comissaoTotal={totalProprio}
                            />
                        </>
                    )}
                </div>

                {/* Charts Section */}
                <ChartsSection
                    houseId={selectedHouse}
                    timeframe={timeframe}
                    affiliateId={viewingUser ? viewingUser.id : selectedAffiliateId}
                    viewingUserId={viewingUser?.id}
                />

                {/* Info Box */}
                <InfoBox
                    title="Atualização de dados"
                    message="Todos os dados do painel são atualizados diariamente, entre 9h e 12h, sempre com base nos resultados do dia anterior."
                />
            </div>

            {/* Referral Dialog - appears automatically if no referrer */}
            <ReferralDialog
                isOpen={showReferralDialog}
                onClose={() => setShowReferralDialog(false)}
                onSuccess={() => setHasReferrer(true)}
            />
        </MainLayout>
    );
}
