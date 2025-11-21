// /api/triage.js
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.GOOGLE_API_KEY) {
    console.error("Missing GOOGLE_API_KEY");
    return res.status(500).json({ error: "Server misconfiguration" });
  }

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

  const { symptoms, age, gender, duration, location } = req.body || {};

  // Basic validation – keep it simple for now
  if (!symptoms || !age || !gender || !duration) {
    return res.status(400).json({
      error: "Missing required fields: symptoms, age, gender, duration"
    });
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.3,
        responseMimeType: "application/json"
      }
    });

    const prompt = `
You are a medical triage assistant for low-resource African communities.

A patient has provided:

Symptoms: ${symptoms}
Age: ${age}
Gender: ${gender}
Duration: ${duration}
Location: ${location || "Not specified"}

You MUST return ONLY valid JSON in this structure:

{
  "risk_scores": {
    "malaria": number (0 to 1),
    "diabetes": number (0 to 1),
    "respiratory_infection": number (0 to 1)
  },
  "explanation": "Short, clear summary for a non-medical person (2–4 sentences). Do NOT give a diagnosis, only describe risk and advise seeing a health worker if needed."
}

Rules:
- Increase malaria risk when fever, chills, sweating, body pains, headaches, fatigue are present, especially in malaria-endemic regions.
- Increase diabetes risk when frequent urination, excessive thirst, unexplained weight loss, blurred vision are present, especially in adults.
- Increase respiratory infection risk when cough, difficulty breathing, chest tightness, runny nose, sore throat, or wheezing are present.
- If symptoms are very severe, reflect that in the explanation but still do NOT claim a diagnosis.
`;

    const result = await model.generateContent(prompt);

    // Because we set responseMimeType: "application/json",
    // this should already be a JSON string.
    const rawText = result.response.text().trim();

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      console.error("JSON parse error from Gemini:", rawText);
      throw parseErr;
    }

    // Basic shape check
    if (!data.risk_scores) {
      console.error("Unexpected response shape from Gemini:", data);
      return res.status(500).json({
        error: "Unexpected AI response shape"
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("TRIAGE API ERROR (Gemini):", error);
    return res.status(500).json({
      error: "AI triage failed",
      details: error.message
    });
  }
}
