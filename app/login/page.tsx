"use client"

import { useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldAlert, Loader2 } from "lucide-react"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [isSignUp, setIsSignUp] = useState(false)

    async function handleAuth() {
        setLoading(true)
        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({ email, password })
                if (error) throw error
                alert("Account created! Logging you in...")
                // Auto login after signup in Supabase defaults
                const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
                if (!signInError) router.push("/dashboard")
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password })
                if (error) throw error
                router.push("/dashboard")
            }
        } catch (error: any) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-[#1E293B] border-slate-700">
                <CardHeader className="text-center space-y-2">
                    <div className="flex justify-center mb-4">
                        <ShieldAlert className="h-12 w-12 text-blue-500" />
                    </div>
                    <CardTitle className="text-2xl text-white">
                        {isSignUp ? "Create Account" : "SupplyAlert Login"}
                    </CardTitle>
                    <p className="text-slate-400 text-sm">Access your secure analysis dashboard</p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500">EMAIL</label>
                        <Input
                            type="email"
                            className="bg-slate-900 border-slate-600 text-white"
                            value={email} onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500">PASSWORD</label>
                        <Input
                            type="password"
                            className="bg-slate-900 border-slate-600 text-white"
                            value={password} onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <Button onClick={handleAuth} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSignUp ? "Sign Up" : "Log In"}
                    </Button>

                    <div className="text-center">
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-sm text-slate-400 hover:text-white underline"
                        >
                            {isSignUp ? "Already have an account? Log In" : "No account? Sign Up"}
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}