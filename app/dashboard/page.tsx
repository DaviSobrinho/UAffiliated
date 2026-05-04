"use client";

import MainLayout from "@/components/layouts/MainLayout";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import BalanceCard from "@/components/cards/BalanceCard";
import MinhaPerformance from "@/components/dashboard/MinhaPerformance";
import PerformanceEquipe from "@/components/dashboard/PerformanceEquipe";
import TeamAffiliatesTable from "@/components/dashboard/TeamAffiliatesTable";
import ChartsSection from "@/components/dashboard/ChartsSection";
import InfoBox from "@/components/dashboard/InfoBox";
import TimeframeSelector from "@/components/TimeframeSelector";
import AffiliateLinksSection from "@/components/dashboard/AffiliateLinksSection";
import AffiliateFilter from "@/components/dashboard/AffiliateFilter";
import UserSelector from "@/components/dashboard/UserSelector";
import AdminPanel from "@/components/admin/AdminPanel";
import { useHouse } from "@/context/HouseContext";
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
    const [user, setUser] = useState<User | null>(null);
    const [viewingUser, setViewingUser] = useState<{ id: string; name: string } | null>(null);
    const [timeframe, setTimeframe] = useState("7d");
    const [selectedAffiliateId, setSelectedAffiliateId] = useState("all");
    const [houseData, setHouseData] = useState<UserHouseData | null>(null);
    const [loading, setLoading] = useState(false);
    const [myPerformanceLoading, setMyPerformanceLoading] = useState(false);
    const [teamLoading, setTeamLoading] = useState(false);
    const [myRegistros, setMyRegistros] = useState(0);
    const [myFtds, setMyFtds] = useState(0);
    const [myQftds, setMyQftds] = useState(0);
    const [meuRev, setMeuRev] = useState("R$ 0,00");
    const [totalProprio, setTotalProprio] = useState("R$ 0,00");
    const [teamRegistros, setTeamRegistros] = useState(0);
    const [teamFtds, setTeamFtds] = useState(0);
    const [teamQftds, setTeamQftds] = useState(0);
    const [teamComissao, setTeamComissao] = useState("R$ 0,00");
    const [hasReferrer, setHasReferrer] = useState(true);
    const [showReferralDialog, setShowReferralDialog] = useState(false);
    const [refreshCooldown, setRefreshCooldown] = useState(0);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    useEffect(() => {
        if (!hasReferrer && user?.role !== "ADMIN") {
            setShowReferralDialog(true);
        }
    }, [hasReferrer, user?.role]);

    useEffect(() => {
        if (selectedHouse && user?.id) {
            fetchHouseData();
        }
    }, [selectedHouse, user?.id, viewingUser, timeframe]);

    useEffect(() => {
        if (refreshCooldown > 0) {
            const timer = setTimeout(() => setRefreshCooldown(refreshCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [refreshCooldown]);

    const handleRefresh = async () => {
        if (refreshCooldown > 0) return;

        setRefreshCooldown(10);
        await Promise.all([
            fetchHouseData(),
            fetchMyPerformance(),
            fetchTeamPerformance(),
        ]);
    };

    useEffect(() => {
        if (selectedHouse && user?.id && houseData) {
            fetchMyPerformance();
        }
    }, [selectedHouse, user?.id, houseData]);

    useEffect(() => {
        if (selectedHouse && selectedAffiliateId !== undefined) {
            fetchTeamPerformance();
        }
    }, [selectedHouse, selectedAffiliateId, timeframe]);

    const fetchMyPerformance = async () => {
        try {
            setMyPerformanceLoading(true);

            if (houseData) {
                setMyRegistros(houseData.registros);
                setMyFtds(houseData.ftds);
                setMyQftds(houseData.qftds);
                const meuRevValue = Number(houseData.cpa) * houseData.qftds;
                setMeuRev(formatCPA(meuRevValue));
            } else {
                setMyRegistros(0);
                setMyFtds(0);
                setMyQftds(0);
                setMeuRev("R$ 0,00");
            }
        } catch (err) {
            console.error("Error fetching my performance:", err);
            setMyRegistros(0);
            setMyFtds(0);
            setMyQftds(0);
            setMeuRev("R$ 0,00");
        } finally {
            setMyPerformanceLoading(false);
        }
    };


    const fetchHouseData = async () => {
        try {
            setLoading(true);

            if (viewingUser) {
                // View-as mode: fetch data for the selected user
                const viewAsRes = await fetch(`/api/users/view-as/${viewingUser.id}?houseId=${selectedHouse}&timeframe=${timeframe}`);

                if (viewAsRes.ok) {
                    const data = await viewAsRes.json();
                    setHouseData(data.houseData);

                    if (data.houseData) {
                        const meuRevValue = Number(data.houseData.cpa) * data.houseData.qftds;
                        setMeuRev(formatCPA(meuRevValue));
                    } else {
                        setMeuRev("R$ 0,00");
                    }

                    if (data.performance) {
                        setTotalProprio(formatCPA(data.performance.totalProprio));
                    } else {
                        setTotalProprio("R$ 0,00");
                    }
                } else {
                    setHouseData(null);
                    setMeuRev("R$ 0,00");
                    setTotalProprio("R$ 0,00");
                }
            } else {
                // Normal mode: fetch logged-in user's data
                const [houseDataRes, performanceRes, userRes] = await Promise.all([
                    fetch(`/api/users/me/house-data?houseId=${selectedHouse}`),
                    fetch(`/api/users/me/performance-summary?houseId=${selectedHouse}&timeframe=${timeframe}`),
                    fetch(`/api/users/me`),
                ]);

                if (houseDataRes.ok) {
                    const data = await houseDataRes.json();
                    setHouseData(data.houseData);

                    if (data.houseData) {
                        const meuRevValue = Number(data.houseData.cpa) * data.houseData.qftds;
                        setMeuRev(formatCPA(meuRevValue));
                    } else {
                        setMeuRev("R$ 0,00");
                    }
                } else {
                    setHouseData(null);
                    setMeuRev("R$ 0,00");
                }

                if (performanceRes.ok) {
                    const perfData = await performanceRes.json();
                    setTotalProprio(formatCPA(perfData.totalProprio));
                } else {
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
            setMeuRev("R$ 0,00");
            setTotalProprio("R$ 0,00");
        } finally {
            setLoading(false);
        }
    };

    const fetchTeamPerformance = async () => {
        try {
            setTeamLoading(true);
            const affiliateIdToFetch = viewingUser ? viewingUser.id : selectedAffiliateId;
            const res = await fetch(
                `/api/users/me/charts?houseId=${selectedHouse}&affiliateId=${affiliateIdToFetch}&timeframe=${timeframe}`
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

    // Dependency arrays need the functions to be defined
    // Moving effect to after function definitions is handled by React hoisting

    return (
        <MainLayout>
            <DashboardHeader title="Dashboard" subtitle={user ? `Bem-vindo, ${user.name}!` : "Bem-vindo!"} />

            <div className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
                {/* Admin Panel - Only for ADMIN users */}
                {user?.role === "ADMIN" && <AdminPanel />}


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
                                amount="R$ 0,00"
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
                                Minha Performance
                            </h2>
                            <p className="text-zinc-500 text-xs md:text-sm">
                                Resultados que eu trouxe diretamente
                            </p>
                        </div>

                        {/* Ações */}
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            <button
                                onClick={handleRefresh}
                                disabled={refreshCooldown > 0}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-sm hover:bg-zinc-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <RotateCcw size={16} className={refreshCooldown > 0 ? "animate-spin" : ""} />
                                {refreshCooldown > 0 ? `${refreshCooldown}s` : "Atualizar"}
                            </button>

                            <div className="w-full sm:w-64">
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
                        <MinhaPerformance
                            registros={myRegistros}
                            ftds={myFtds}
                            qftds={myQftds}
                            cpa={formatCPA(houseData?.cpa || 0)}
                            reu={meuRev}
                            totalPaguito={totalProprio}
                        />
                    )}
                </div>

                {/* User Selector */}
                {!loading && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <h3 className="text-sm md:text-base font-medium text-zinc-400">Visualizar dados de:</h3>
                        <div className="w-full sm:w-64">
                            <UserSelector value={viewingUser} onChange={setViewingUser} />
                        </div>
                    </div>
                )}

                {/* Affiliate Filter for Team Performance */}
                {!loading && !viewingUser && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <h2 className="text-lg md:text-xl font-bold text-white">Performance de Equipe</h2>
                        <div className="w-full sm:w-64 sm:ml-auto">
                            <AffiliateFilter
                                houseId={selectedHouse}
                                value={selectedAffiliateId}
                                onChange={setSelectedAffiliateId}
                            />
                        </div>
                    </div>
                )}

                {/* Team Performance Header - when viewing a specific user */}
                {!loading && viewingUser && (
                    <h2 className="text-lg md:text-xl font-bold text-white">Performance da Equipe de {viewingUser.name}</h2>
                )}

                {/* Team Performance Section */}
                {teamLoading ? (
                    <div className="space-y-3">
                        <SkeletonLine width="20%" height="1.5rem" />
                        <SkeletonBox height="10rem" />
                    </div>
                ) : (
                    <>
                        <PerformanceEquipe
                            registros={teamRegistros}
                            ftds={teamFtds}
                            qftds={teamQftds}
                            comissao={teamComissao}
                        />
                        {viewingUser && (
                            <TeamAffiliatesTable selectedUserId={viewingUser.id} />
                        )}
                    </>
                )}

                {/* Charts Section */}
                <ChartsSection houseId={selectedHouse} timeframe={timeframe} affiliateId={selectedAffiliateId} viewingUserId={viewingUser?.id} />

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
