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
    // -------------------------------
    // USE VALID CHAT COMPLETION API
    // -------------------------------
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You are a clinical triage assistant. Only return STRICT VALID JSON. No markdown. No backticks.",
        },
        {
          role: "user",
          content: `
Symptoms: ${symptoms}
Age: ${age}
Gender: ${gender}
Duration: ${duration}

Return ONLY JSON:
{
  "risk_scores": {
    "malaria": number (0-1),
    "diabetes": number (0-1),
    "respiratory_infection": number (0-1)
  },
  "explanation": "2-4 sentence summary"
}
`,
        },
      ],
    });

    let text = completion.choices[0].message.content.trim();

    // Remove stray markdown if present
    text = text.replace(/^```json/, "").replace(/^```/, "").replace(/```$/, "");

    const data = JSON.parse(text);

    return res.status(200).json(data);
  } catch (err) {
    console.error("TRIAGE API ERROR:", err);

    return res.status(500).json({
      error: "AI triage failed",
      details: err.message,
    });
  }
}
