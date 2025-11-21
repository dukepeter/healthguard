// /api/triage.js
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const { symptoms, age, gender, duration } = req.body;

    if (!symptoms || !age || !gender || !duration) {
      return res.status(400).json({
        error: "Missing required fields"
      });
    }

    // Ask Gemini
    const prompt = `
You are a medical triage assistant. Return ONLY valid JSON.

Symptoms: ${symptoms}
Age: ${age}
Gender: ${gender}
Duration: ${duration}

Respond in this format only:

{
  "risk_scores": {
    "malaria": number between 0 and 1,
    "diabetes": number between 0 and 1,
    "respiratory_infection": number between 0 and 1
  },
  "explanation": "Short 2–4 sentence reasoning"
}
`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();

    // Clean JSON if Gemini wraps it in code block
    text = text.replace(/^```json/, "").replace(/```$/, "");

    const data = JSON.parse(text);

    return res.status(200).json(data);
  } catch (error) {
    console.error("TRIAGE ERROR:", error);
    return res.status(500).json({
      error: "Gemini triage failed",
      details: error.message
    });
  }
}
