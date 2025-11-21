// /api/triage.js
import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const { symptoms, age, gender, duration, location, audioText, imageDescriptions } = req.body;

  // Basic required fields
  if (!symptoms || !age || !gender || !duration || !location) {
    return res.status(400).json({
      error: "Missing required fields: symptoms, age, gender, duration, location",
    });
  }

  // Prepare dynamic fields
  const audioSegment = audioText ? `\nAudio transcription: ${audioText}\n` : "";
  const imagesSegment = imageDescriptions?.length
    ? `\nUser provided image descriptions: ${imageDescriptions.join(", ")}\n`
    : "";

  try {
    // ---------------------------
    // New OpenAI Responses API
    // ---------------------------
    const completion = await client.responses.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      input: `
You are a medical triage assistant for low-resource African communities.

You MUST return ONLY valid JSON in this format:

{
  "risk_scores": {
    "malaria": 0-1,
    "diabetes": 0-1,
    "respiratory_infection": 0-1
  },
  "explanation": "Short readable summary for the user."
}

Patient info:
Age: ${age}
Gender: ${gender}
Location: ${location}
Duration: ${duration}
Symptoms: ${symptoms}
${audioSegment}
${imagesSegment}

Follow these signals:
- Malaria: fever, chills, sweating, headache, weakness, body pains
- Diabetes: frequent urination, thirst, blurred vision, fatigue
- Respiratory issues: cough, congestion, breathing difficulty, chest tightness

Only output JSON.
      `,
    });

    let text = completion.output_text.trim();

    // Remove accidental code fences
    text = text.replace(/^```json/, "").replace(/```$/, "").trim();

    const result = JSON.parse(text);

    return res.status(200).json(result);
  } catch (error) {
    console.error("TRIAGE API ERROR:", error);

    return res.status(500).json({
      error: "AI triage failed",
      details: error.message,
    });
  }
}
