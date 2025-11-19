import fs from "fs";
import path from "path";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { message, result, timestamp } = req.body;

  if (!message || !timestamp) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Load consultations file
  const dbPath = path.join(process.cwd(), "consultations.json");
  const db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));

  // Create entry
  const entry = {
    id: "consult-" + Date.now(),
    message,
    assessment: result,
    timestamp,
    status: "pending",
    doctor_reply: null
  };

  db.messages.push(entry);

  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

  return res.status(200).json({
    success: true,
    message: "Doctor has received your anonymous consultation request."
  });
}

