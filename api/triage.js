// /api/triage.js
// Node serverless function on Vercel using OpenAI via HTTP fetch

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { symptoms, age, gender, duration } = req.body || {};

  // Basic validation
  if (!symptoms || !age || !gender || !duration) {
    return res.status(400).json({
      error: "Missing required fields: symptoms, age, gender, duration"
    });
  }

  // Build the user prompt
  const userPrompt = `
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
- Malaria risk increases if symptoms include: fever, chills, sweating, headache, joint pain, fatigue, recent mosquito exposure.
- Diabetes risk increases if symptoms include: excessive thirst, frequent urination, blurred vision, unexplained weight loss, slow healing sores.
- Respiratory infection risk increases if symptoms include: cough, shortness of breath, runny nose, sore throat, chest pain/tightness.
- Always base risk scoring on symptoms + age patterns.
- Scale each risk between 0.0 and 1.0.
- Explanation MUST be 2–4 sentences maximum.
`;

  try {
    // Call OpenAI directly via HTTP
    const apiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "You are a clinical triage assistant. You must output ONLY valid JSON and nothing else."
          },
          {
            role: "user",
            content: userPrompt
          }
        ]
      })
    });

    // If OpenAI itself failed
    if (!apiRes.ok) {
      const errorText = await apiRes.text();
      console.error("OpenAI API error:", apiRes.status, errorText);
      return res.status(502).json({
        error: "Upstream OpenAI error",
        status: apiRes.status,
        details: errorText
      });
    }

    const apiJson = await apiRes.json();

    let content =
      apiJson?.choices?.[0]?.message?.content?.trim() || "";

    // Some models wrap JSON in ```json ... ``` – strip that off
    content = content
      .replace(/^```json/i, "")
      .replace(/^```/, "")
      .replace(/```$/, "")
      .trim();

    const data = JSON.parse(content);

    // Final sanity check
    if (!data || !data.risk_scores) {
      console.error("Parsed JSON missing risk_scores:", data);
      return res.status(500).json({
        error: "AI returned invalid structure"
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("TRIAGE API ERROR:", err);
    return res.status(500).json({
      error: "AI triage failed",
      details: err.message
    });
  }
}
