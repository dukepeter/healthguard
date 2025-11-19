import fs from "fs";
import path from "path";

export default function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { id, reply } = req.body;

    if (!id || !reply) {
        return res.status(400).json({ error: "Missing fields." });
    }

    const dbPath = path.join(process.cwd(), "consultations.json");
    const db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));

    const entry = db.messages.find(m => m.id === id);

    if (!entry) {
        return res.status(404).json({ error: "Consultation not found." });
    }

    entry.doctor_reply = reply;
    entry.status = "replied";

    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    return res.status(200).json({ message: "Reply sent successfully." });
}

