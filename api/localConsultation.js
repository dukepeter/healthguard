import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { patientMessage, assessment } = req.body;

  if (!patientMessage || !assessment) {
    return res.status(400).json({ error: "Missing message or assessment" });
  }

  const filePath = path.join(process.cwd(), "consultations.json");

  let db = { messages: [] };

  if (fs.existsSync(filePath)) {
    db = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  const newEntry = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    assessment,
    patientMessage,
    doctorReply: "Doctor will review your case shortly…"
  };

  db.messages.push(newEntry);

  fs.writeFileSync(filePath, JSON.stringify(db, null, 2));

  res.status(200).json({ success: true, entry: newEntry });
}

