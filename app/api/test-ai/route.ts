import { GoogleGenerativeAI, GenerationConfig } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { depart, arrivee, produit } = body;

        if (!depart || !arrivee) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

        // 1. TAVILY
        const query = `maritime shipping risk news ${depart} to ${arrivee} delays conflict weather storm`;
        // On met un try/catch ici aussi au cas où Tavily plante
        let contextNews = "No recent news found.";
        try {
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
            if (searchData.results) {
                contextNews = searchData.results.map((r: any) => `[${r.published_date}] ${r.content}`).join("\n");
            }
        } catch (e) {
            console.error("Tavily Error (Continuing without news):", e);
        }

        // 2. GEMINI EN MODE JSON
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
        const generationConfig: GenerationConfig = {
            temperature: 0.7,
            maxOutputTokens: 1000,
            responseMimeType: "application/json" // FORCE LE JSON
        };

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig });

        const prompt = `
      Role: Logistics Risk Analyst. Date: ${new Date().toLocaleDateString()}.
      Route: ${depart} to ${arrivee}.
      Cargo: "${produit || "General Cargo"}".
      
      News Context:
      ${contextNews}

      Task: Analyze risk. If cargo is seasonal/perishable and route has delays, Risk Score must be > 80.

      Output strictly valid JSON:
      {
        "score": number (0-100),
        "explanation": "string (3 sentences analyzing route + cargo impact)",
        "verdict": "string (Short conclusion starting with 'VERDICT:')"
      }
    `;

        const result = await model.generateContent(prompt);
        const textResponse = result.response.text();

        // Parsing du JSON
        const jsonResponse = JSON.parse(textResponse);

        // Construction du texte pour l'affichage
        const finalExplanation = jsonResponse.explanation;
        const finalVerdict = jsonResponse.verdict;
        const finalScore = jsonResponse.score;

        const textIA = `${finalExplanation}\n\n${finalVerdict}`;

        return NextResponse.json({ message: "Success", reponse_ia: textIA, score: finalScore });

    } catch (error: any) {
        console.error("Backend Global Error:", error);
        // On renvoie l'erreur au frontend pour qu'il l'affiche
        return NextResponse.json({ error: error.message || "Analysis failed" }, { status: 500 });
    }
}