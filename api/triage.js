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
    // Send structured prompt to OpenAI
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,

      messages: [
        {
          role: "system",
          content:
            "You are a clinical triage assistant. You must output ONLY valid JSON and nothing else.",
        },
        {
          role: "user",
          content: `
A patient has provided the following information:

Symptoms: ${symptoms}
Age: ${age}
Gender: ${gender}
Duration: ${duration}

Return ONLY valid JSON in the following structure:
{
  "risk_scores": {
    "malaria": number (between 0 and 1),
    "diabetes": number (between 0 and 1),
    "respiratory_infection": number (between 0 and 1)
  },
  "explanation": "A short medical reasoning summary explaining the risks."
}

Rules:
- Malaria risk increases if symptoms include: fever, chills, sweating, headache, joint pain, fatigue.
- Diabetes risk increases if symptoms include: excessive thirst, frequent urination, blurred vision, slow healing sores.
- Respiratory infection risk increases if symptoms include: cough, shortness of breath, runny nose, chest tightness.
- Always base risk scoring on symptoms + age patterns.
- Scale risk between 0.0 and 1.0.
- Explanation MUST be 2–4 sentences maximum.
`,
        },
      ],
    });

    // Extract JSON
    let content = response.choices[0].message.content.trim();

    // Some models wrap JSON in backticks — remove them
    content = content.replace(/^```json/, "").replace(/```$/, "");

    const data = JSON.parse(content);

    return res.status(200).json(data);
  } catch (error) {
    console.error("TRIAGE API ERROR:", error);
    return res.status(500).json({
      error: "AI triage failed",
      details: error.message,
    });
  }
}

