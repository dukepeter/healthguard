// /api/triage.js
import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const { symptoms, age, gender, duration } = req.body;

  if (!symptoms || !age || !gender || !duration) {
    return res.status(400).json({
      error: "Missing required fields: symptoms, age, gender, duration",
    });
  }

  try {
    // Send request to OpenAI
    const aiResponse = await client.responses.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      input: [
        {
          role: "system",
          content:
            "You are a clinical triage assistant. Only return STRICT JSON. No explanations outside JSON.",
        },
        {
          role: "user",
          content: `
A patient has provided:

Symptoms: ${symptoms}
Age: ${age}
Gender: ${gender}
Duration: ${duration}

Return ONLY valid JSON:
{
  "risk_scores": {
    "malaria": number,
    "diabetes": number,
    "respiratory_infection": number
  },
  "explanation": "Short medical reasoning (2-4 sentences)"
}
`,
        },
      ],
    });

    // Extract text correctly from the Responses API
    const text = aiResponse.output[0].content[0].text.trim();

    // Remove accidental code fences
    const cleaned = text
      .replace(/^```json/, "")
      .replace(/^```/, "")
      .replace(/```$/, "")
      .trim();

    const data = JSON.parse(cleaned);

    return res.status(200).json(data);
  } catch (error) {
    console.error("TRIAGE API ERROR:", error);

    return res.status(500).json({
      error: "AI triage failed",
      details: error.message,
    });
  }
}
