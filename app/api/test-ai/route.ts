import { GoogleGenerativeAI, GenerationConfig } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { depart, arrivee, produit } = body;

        if (!depart || !arrivee) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

        // 1. TAVILY (Recherche d'actus contextuelles)
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

        // 2. GEMINI (Mode Analyste Business)
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

        // On garde la température à 1 pour la fluidité, mais le prompt va cadrer la logique
        const generationConfig: GenerationConfig = { temperature: 1, maxOutputTokens: 1000 };
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig });

        const prompt = `
      Role: Strategic Logistics Analyst. 
      Current Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
      Route: ${depart} to ${arrivee}.
      Cargo: "${produit || "General Cargo"}"
      
      News Context:
      ${contextNews}

      TASK: Perform a Business Impact Analysis.
      
      STEP 1: Analyze the Route Risk (Weather, War, Strikes).
      STEP 2: Analyze the Cargo Sensitivity.
         - Is it Seasonal? (e.g., "Christmas" implies deadline Dec 25, "Valentine" implies Feb 14).
         - Is it Perishable? (e.g., Fruit, Veg, Pharma).
      STEP 3: Compare Current Date vs. Implied Deadline.
         - If the route has delays AND the cargo misses its seasonal window (e.g. Christmas toys arriving Jan 2), the Risk Score MUST be CRITICAL (90-100), even if the ship is safe.
         - If cargo is perishable and delays > 5 days are likely, Risk Score MUST be CRITICAL (80-100).

      SCORING LOGIC (0-100):
      - 0-20: Smooth sailing, no product urgency.
      - 21-50: Minor delays, product not time-sensitive.
      - 51-80: Significant route delays OR product allows no margin for error.
      - 81-100: BUSINESS FAILURE RISK. (Missed Season / Spoiled Cargo / War Zone).

      OUTPUT FORMAT (Strictly separate with | ):
      SCORE|ANALYSIS|VERDICT

      Details:
      - SCORE: Integer.
      - ANALYSIS: Explain the route risk AND the specific business impact on "${produit}". Mention if deadlines are at risk.
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

            // Sécurité anti-incohérence (Mots clés d'urgence absolue)
            const fullText = (explication + conclusion).toLowerCase();
            const panicWords = ["spoiled", "missed deadline", "useless", "business failure", "too late"];

            if (panicWords.some(mot => fullText.includes(mot)) && score < 80) {
                score = 90; // On force le rouge écarlate si l'IA dit que c'est "trop tard"
            }

            textIA = `${explication}\n\n${conclusion}`;
        }

        return NextResponse.json({ message: "Success", reponse_ia: textIA, score: score });

    } catch (error: any) {
        return NextResponse.json({ error: "Server Error", details: error.message }, { status: 500 });
    }
}