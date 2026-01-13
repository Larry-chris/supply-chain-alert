"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { ShieldAlert, Activity, MapPin, History, MessageCircle, ChevronDown, ChevronUp, LogOut } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function HistoriquePage() {
    const [historique, setHistorique] = useState<any[]>([])
    const [openRouteId, setOpenRouteId] = useState<number | null>(null)
    const [avgRisk, setAvgRisk] = useState(0)
    const router = useRouter()

    useEffect(() => {
        chargerHistorique()
    }, [])

    async function deconnexion() {
        await supabase.auth.signOut()
        router.push("/login")
    }

    async function chargerHistorique() {
        // Sécurité : Supabase ne renverra que TES données grâce à la règle RLS
        const { data } = await supabase
            .from('routes')
            .select('*')
            .order('id', { ascending: false })
            .limit(50)

        if (data) {
            setHistorique(data)
            const total = data.reduce((acc, curr) => acc + (curr.risk_score || 0), 0)
            setAvgRisk(data.length > 0 ? Math.round(total / data.length) : 0)
        }
    }

    const toggleRoute = (id: number) => setOpenRouteId(openRouteId === id ? null : id)

    return (
        <div className="min-h-screen bg-[#0B1120] text-slate-100 font-sans flex pb-20 md:pb-0">

            {/* SIDEBAR (PC) */}
            <aside className="fixed left-0 top-0 h-full w-64 border-r border-slate-800 bg-[#0F172A] p-6 hidden md:flex flex-col">
                <div className="flex items-center gap-2 font-bold text-xl text-blue-500 mb-10">
                    <ShieldAlert className="h-8 w-8" /> <span>SupplyAlert</span>
                </div>
                <nav className="space-y-2">
                    <Link href="/dashboard">
                        <Button variant="ghost" className="w-full justify-start gap-3 text-slate-400 hover:text-white hover:bg-slate-800">
                            <Activity className="h-4 w-4" /> Dashboard
                        </Button>
                    </Link>
                    <Link href="#">
                        <Button variant="ghost" className="w-full justify-start gap-3 text-slate-400 cursor-not-allowed opacity-50">
                            <MapPin className="h-4 w-4" /> Cartographie (Bientôt)
                        </Button>
                    </Link>
                    <Link href="/historique">
                        <Button variant="ghost" className="w-full justify-start gap-3 bg-slate-800 text-white font-medium">
                            <History className="h-4 w-4 text-blue-400" /> Historique
                        </Button>
                    </Link>
                </nav>
                <div className="mt-auto pt-6 border-t border-slate-800">
                    <Button onClick={deconnexion} variant="outline" className="w-full border-slate-700 text-slate-400 hover:text-white hover:bg-red-900/20 hover:border-red-900">
                        <LogOut className="h-4 w-4 mr-2" /> Déconnexion
                    </Button>
                </div>
            </aside>

            {/* BARRE MOBILE (TÉLÉPHONE) */}
            <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#0F172A] border-t border-slate-800 p-4 flex justify-around items-center z-50">
                <Link href="/" className="flex flex-col items-center text-slate-400 hover:text-white">
                    <Activity className="h-6 w-6" />
                    <span className="text-[10px] mt-1">Scan</span>
                </Link>
                <Link href="/historique" className="flex flex-col items-center text-blue-500">
                    <History className="h-6 w-6" />
                    <span className="text-[10px] mt-1 font-bold">Historique</span>
                </Link>
                <button onClick={deconnexion} className="flex flex-col items-center text-slate-400 hover:text-red-500">
                    <LogOut className="h-6 w-6" />
                    <span className="text-[10px] mt-1">Sortir</span>
                </button>
            </div>

            {/* CONTENU */}
            <main className="md:ml-64 p-8 w-full">
                <h1 className="text-3xl font-bold mb-6">Historique des Analyses</h1>

                <div className="mb-8 p-4 bg-slate-900 border border-slate-800 rounded-lg inline-block">
                    <span className="text-slate-400 text-sm">Risque Moyen Global : </span>
                    <span className={`font-bold ${avgRisk > 50 ? 'text-red-400' : 'text-green-400'}`}>{avgRisk}/100</span>
                </div>

                <div className="space-y-3 max-w-4xl pb-10">
                    {historique.map((route) => (
                        <div key={route.id} className="bg-[#1E293B] border border-slate-700 rounded-lg overflow-hidden">
                            <div onClick={() => toggleRoute(route.id)} className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition">
                                <div className="flex items-center gap-4">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm border ${route.risk_score > 50 ? 'border-red-500 text-red-400' : 'border-green-500 text-green-400'}`}>
                                        {route.risk_score}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white text-sm md:text-base">{route.origin} ➝ {route.destination}</h3>
                                        <p className="text-xs text-slate-500">{new Date(route.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                {openRouteId === route.id ? <ChevronUp className="text-blue-500" /> : <ChevronDown className="text-slate-500" />}
                            </div>

                            {openRouteId === route.id && (
                                <div className="p-4 pt-0 border-t border-slate-700/50">
                                    <p className="mt-4 text-slate-300 text-sm leading-relaxed whitespace-pre-line">{route.ai_report}</p>
                                    <Button className="mt-4 bg-green-600 hover:bg-green-500 text-white gap-2 h-8 text-xs" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(route.ai_report)}`, '_blank')}>
                                        <MessageCircle className="h-3 w-3" /> WhatsApp
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}
                    {historique.length === 0 && <p className="text-slate-500">Aucun historique trouvé.</p>}
                </div>
            </main>
        </div>
    )
}