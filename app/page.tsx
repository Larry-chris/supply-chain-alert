import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShieldAlert, BarChart3, Globe, Lock, ArrowRight, CheckCircle2 } from "lucide-react"

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[#0B1120] text-slate-100 font-sans selection:bg-blue-500/30">

            {/* NAVIGATION */}
            <nav className="border-b border-slate-800 bg-[#0F172A]/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <ShieldAlert className="h-6 w-6 text-blue-500" />
                        <span>SupplyAlert</span>
                        <span className="text-xs font-normal text-slate-500 ml-2 border border-slate-700 px-2 py-0.5 rounded-full">by Lcompany</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                            Connexion
                        </Link>
                        <Link href="/login">
                            <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-6">
                                Essayer Gratuitement
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* HERO SECTION */}
            <section className="pt-20 pb-32 px-6 text-center max-w-4xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wide mb-6">
                    <span className="relative flex h-2 w-2 mr-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    Nouvelle IA Logistique 2026
                </div>

                <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
                    Anticipez les retards maritimes avant tout le monde.
                </h1>

                <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                    SupplyAlert analyse l'actualité mondiale en temps réel pour prédire les risques sur vos routes maritimes. Ne laissez plus une grève ou une tempête surprendre votre stock.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/login">
                        <Button className="h-14 px-8 text-lg bg-blue-600 hover:bg-blue-500 rounded-full shadow-lg shadow-blue-900/20 w-full sm:w-auto">
                            Lancer une analyse <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </Link>
                </div>

                <p className="mt-6 text-sm text-slate-500">
                    Pas de carte bancaire requise • 100% Gratuit en Beta
                </p>
            </section>

            {/* FEATURES GRID */}
            <section className="bg-[#0F172A] py-24 border-y border-slate-800">
                <div className="max-w-6xl mx-auto px-6">
                    <h2 className="text-3xl font-bold text-center mb-16">Pourquoi les importateurs utilisent SupplyAlert ?</h2>

                    <div className="grid md:grid-cols-3 gap-12">
                        <FeatureCard
                            icon={<Globe className="h-8 w-8 text-blue-500" />}
                            title="Surveillance Mondiale 24/7"
                            desc="Notre IA scanne des milliers d'articles de presse chaque minute pour détecter conflits, météo et grèves."
                        />
                        <FeatureCard
                            icon={<BarChart3 className="h-8 w-8 text-green-500" />}
                            title="Score de Risque Précis"
                            desc="Obtenez un verdict clair (0 à 100) sur la fiabilité de votre route. Fini les suppositions."
                        />
                        <FeatureCard
                            icon={<Lock className="h-8 w-8 text-purple-500" />}
                            title="Communication Client"
                            desc="Générez automatiquement des messages WhatsApp pour prévenir vos clients des retards. Protégez votre réputation."
                        />
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="py-12 text-center text-slate-600 text-sm border-t border-slate-800">
                <p>© 2026 Lcompany. Tous droits réservés.</p>
                <p className="mt-2">Conçu avec ❤️ au Bénin pour le monde entier.</p>
            </footer>
        </div>
    )
}

function FeatureCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
    return (
        <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-[#0B1120] border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="mb-6 p-4 bg-slate-900 rounded-xl">{icon}</div>
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-slate-400 leading-relaxed">{desc}</p>
        </div>
    )
}