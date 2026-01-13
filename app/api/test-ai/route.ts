import { GoogleGenerativeAI, GenerationConfig } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { depart, arrivee } = body;

        if (!depart || !arrivee) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

        // 1. TAVILY (English Search)
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
        const contextNews = searchData.results ? searchData.results.map((r: any) => `[${r.published_date}] ${r.content}`).join("\n") : "No recent news.";

        // 2. GEMINI (English Prompt)
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

        const generationConfig: GenerationConfig = {
            temperature: 0.7,
            maxOutputTokens: 1000,
        };

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig });

        const prompt = `
      Role: Maritime Supply Chain Risk Expert. Date: ${new Date().toLocaleDateString()}.
      Route: ${depart} to ${arrivee}.
      
      Recent News:
      ${contextNews}

      SCORING RULES (0-100 Scale):
      - 0-10: NO RISK. Smooth sailing.
      - 11-40: LOW RISK. Minor delays, standard vigilance.
      - 41-70: MEDIUM/HIGH RISK. Bad weather, political tension, strikes.
      - 71-100: CRITICAL RISK. War, Severe Storm, Blockade, Route diversion.

      IMPORTANT: If you mention "Storm", "Conflict", "War" or "Diversion", the score MUST be above 60.

      REQUIRED OUTPUT FORMAT (Separate with vertical bars | ):
      SCORE|EXPLANATION|VERDICT

      Details:
      - SCORE: Integer (e.g., 85).
      - EXPLANATION: 3 clear sentences in English explaining the situation.
      - VERDICT: Short conclusion starting with "VERDICT:".
    `;

        const result = await model.generateContent(prompt);
        const rawText = result.response.text();

        // 3. PARSING
        const parts = rawText.split("|");
        let score = 0;
        let textIA = rawText;

        if (parts.length >= 2) {
            score = parseInt(parts[0].replace(/[^0-9]/g, '').trim());
            if (isNaN(score)) score = 50;

            const explication = parts[1].trim();
            const conclusion = parts[2] ? parts[2].trim() : "";

            // Safety Check
            const fullText = (explication + conclusion).toLowerCase();
            const dangerousWords = ["storm", "severe", "hurricane", "war", "attack", "blockade", "diversion", "red sea"];

            if (dangerousWords.some(mot => fullText.includes(mot)) && score < 50) {
                score = 75;
            }

            textIA = `${explication}\n\n${conclusion}`;
        }

        return NextResponse.json({ message: "Success", reponse_ia: textIA, score: score });

    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Server Error", details: error.message }, { status: 500 });
    }
}