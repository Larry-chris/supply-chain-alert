"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation" // Pour rediriger
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Activity, ShieldAlert, Send, Loader2, AlertTriangle, MapPin, History, LogOut, User } from "lucide-react"
import Link from "next/link"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [userEmail, setUserEmail] = useState("") // Pour afficher l'email
  const [depart, setDepart] = useState("")
  const [arrivee, setArrivee] = useState("")
  const [currentResult, setCurrentResult] = useState<any>(null)

  // SÉCURITÉ : On vérifie au chargement si le mec est connecté
  useEffect(() => {
    verifierSession()
  }, [])

  async function verifierSession() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      // Pas connecté ? Dehors !
      router.push("/login")
    } else {
      setUserEmail(user.email || "")
    }
  }

  async function deconnexion() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  async function lancerAnalyse() {
    if (!depart || !arrivee) return
    setLoading(true)
    setCurrentResult(null)

    try {
      // 1. On appelle l'IA (qui ne sauvegarde pas)
      const response = await fetch("/api/test-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ depart, arrivee }),
      })
      const data = await response.json()

      // 2. C'EST ICI QU'ON SAUVEGARDE (Côté client sécurisé)
      // Supabase ajoute automatiquement le user_id grâce à la session active
      const { error } = await supabase.from('routes').insert([{
        origin: depart,
        destination: arrivee,
        ai_report: data.reponse_ia,
        risk_score: data.score,
        status: 'Analyzed',
        // user_id est ajouté auto par Supabase car on est connectés
      }])

      if (error) console.error("Erreur sauvegarde", error)

      setCurrentResult(data)
    } catch (e) { alert("Erreur analyse") }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 font-sans flex">

      {/* SIDEBAR */}
      <aside className="fixed left-0 top-0 h-full w-64 border-r border-slate-800 bg-[#0F172A] p-6 hidden md:flex flex-col">
        <div className="flex items-center gap-2 font-bold text-xl text-blue-500 mb-10">
          <ShieldAlert className="h-8 w-8" /> <span>SupplyAlert</span>
        </div>
        <nav className="space-y-2">
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start gap-3 bg-slate-800 text-white font-medium">
              <Activity className="h-4 w-4 text-blue-400" /> Dashboard
            </Button>
          </Link>
          <Link href="/historique">
            <Button variant="ghost" className="w-full justify-start gap-3 text-slate-400 hover:text-white hover:bg-slate-800">
              <History className="h-4 w-4" /> Historique
            </Button>
          </Link>
        </nav>

        {/* INFO USER + LOGOUT */}
        <div className="mt-auto pt-6 border-t border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 overflow-hidden">
            <User className="h-4 w-4" />
            <span className="truncate">{userEmail}</span>
          </div>
          <Button onClick={deconnexion} variant="outline" className="w-full border-slate-700 text-slate-400 hover:text-white hover:bg-red-900/20 hover:border-red-900">
            <LogOut className="h-4 w-4 mr-2" /> Déconnexion
          </Button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="md:ml-64 p-8 w-full flex flex-col justify-center min-h-[80vh] max-w-5xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold mb-4">Scanner de Route Maritime</h1>
          <p className="text-slate-400">Espace Sécurisé • Analyse temps réel</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          {/* FORMULAIRE */}
          <Card className="bg-[#1E293B] border-slate-700 shadow-2xl">
            <CardHeader><CardTitle>Nouvelle Analyse</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-slate-500">Départ</label>
                <Input value={depart} onChange={(e) => setDepart(e.target.value)} className="bg-slate-900 border-slate-600 h-12 text-white placeholder:text-slate-500" placeholder="ex: Shanghai" />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-slate-500">Arrivée</label>
                <Input value={arrivee} onChange={(e) => setArrivee(e.target.value)} className="bg-slate-900 border-slate-600 h-12 text-white placeholder:text-slate-500" placeholder="ex: Le Havre" />
              </div>
              <Button onClick={lancerAnalyse} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 h-14 text-lg font-semibold shadow-lg shadow-blue-900/20">
                {loading ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2 h-5 w-5" />}
                {loading ? "Scan en cours..." : "Scanner maintenant"}
              </Button>
            </CardContent>
          </Card>

          {/* RÉSULTAT */}
          <div className="transition-all duration-500">
            {!currentResult && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-xl p-10">
                <MapPin className="h-16 w-16 mb-4 opacity-20" />
                <p>Résultat sécurisé ici.</p>
              </div>
            )}
            {currentResult && (
              <Card className="bg-[#1E293B] border-blue-500/50 shadow-2xl animate-in slide-in-from-right-10 ring-1 ring-blue-500/20">
                <CardHeader className="border-b border-slate-700/50 pb-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-white">Résultat</CardTitle>
                    <div className={`px-4 py-1 rounded-full text-sm font-bold border ${currentResult.score > 50 ? 'bg-red-500/20 text-red-400 border-red-500' : 'bg-green-500/20 text-green-400 border-green-500'}`}>
                      Risque : {currentResult.score}/100
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div>
                    <h3 className="text-slate-400 text-xs uppercase font-bold mb-2">Trajet</h3>
                    <p className="text-xl font-semibold text-white">{depart} ➝ {arrivee}</p>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                    <p className="text-slate-300 leading-relaxed whitespace-pre-line">{currentResult.reponse_ia}</p>
                  </div>
                  <Button className="w-full bg-green-600 hover:bg-green-500 text-white font-bold" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(currentResult.reponse_ia)}`, '_blank')}>
                    WhatsApp
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}