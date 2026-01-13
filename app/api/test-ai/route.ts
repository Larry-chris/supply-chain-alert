import { GoogleGenerativeAI, GenerationConfig } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { depart, arrivee } = body;

        if (!depart || !arrivee) return NextResponse.json({ error: "Champs manquants" }, { status: 400 });

        // 1. TAVILY (Actus récentes 30 jours)
        const query = `maritime shipping risk news ${depart} to ${arrivee} delays conflict weather storm`;
        const tavilyResponse = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                api_key: process.env.TAVILY_API_KEY,
                query: query,
                topic: "news", days: 30, max_results: 5
            })
        });
        const searchData = await tavilyResponse.json();
        const contextNews = searchData.results ? searchData.results.map((r: any) => `[${r.published_date}] ${r.content}`).join("\n") : "Pas d'actus.";

        // 2. GEMINI (Retour à la version Stable + Température équilibrée)
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

        const generationConfig: GenerationConfig = {
            temperature: 1.0,      // Équilibre parfait entre Rigueur et Créativité
        };

        // On utilise le modèle Flash standard (fiable)
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig });

        const prompt = `
      Rôle : Expert maritime. Date : ${new Date().toLocaleDateString()}.
      Route : ${depart} vers ${arrivee}.
      
      Actus récentes :
      ${contextNews}

      RÈGLES STRICTES DE NOTATION (ÉCHELLE 0-100) :
      - 0 à 10 : RISQUE INEXISTANT. Route fluide. Météo calme.
      - 11 à 40 : RISQUE FAIBLE. Petits retards possibles, vigilance normale.
      - 41 à 70 : RISQUE MOYEN/ÉLEVÉ. Mauvaise météo, tensions politiques, grèves.
      - 71 à 100 : RISQUE MAJEUR. Guerre, Tempête Violente, Route Bloquée.

      IMPORTANT : Si tu mentionnes une "Tempête", un "Conflit" ou un "Détour", le score DOIT être supérieur à 60.

      FORMAT DE RÉPONSE OBLIGATOIRE (Sépare par des barres verticales | ) :
      SCORE|EXPLICATION|CONCLUSION

      Détails :
      - SCORE : Un chiffre entier (ex: 85).
      - EXPLICATION : 3 phrases claires et complètes.
      - CONCLUSION : Une phrase courte commençant par "VERDICT :".
    `;

        const result = await model.generateContent(prompt);
        const rawText = result.response.text();

        // 3. PARSING ROBUSTE
        const parts = rawText.split("|");
        let score = 0;
        let textIA = rawText;

        if (parts.length >= 2) {
            // Nettoyage du score pour éviter les bugs
            score = parseInt(parts[0].replace(/[^0-9]/g, '').trim());
            if (isNaN(score)) score = 50;

            const explication = parts[1].trim();
            const conclusion = parts[2] ? parts[2].trim() : "";

            // Filet de sécurité logique
            const fullText = (explication + conclusion).toLowerCase();
            const motsDangereux = ["tempête", "sévère", "ouragan", "guerre", "attaque", "blocus", "détour", "déviation"];

            // Si texte dangereux mais score bas -> on force le score rouge
            if (motsDangereux.some(mot => fullText.includes(mot)) && score < 50) {
                score = 75;
            }

            textIA = `${explication}\n\n${conclusion}`;
        }

        return NextResponse.json({ message: "Succès", reponse_ia: textIA, score: score });

    } catch (error: any) {
        console.error("Erreur API:", error);
        // En cas d'erreur, on renvoie un message clair au lieu de planter
        return NextResponse.json({ error: "Erreur serveur", details: error.message }, { status: 500 });
    }
}