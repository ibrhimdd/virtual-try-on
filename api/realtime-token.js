import { createDecartClient } from "@decartai/sdk";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.DECART_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "DECART_API_KEY is not configured in Vercel." });
  }

  try {
    const decart = createDecartClient({ apiKey });
    const token = await decart.tokens.create({ expiresIn: 300 });
    return res.status(200).json({ apiKey: token.apiKey });
  } catch (error) {
    console.error("Decart client-token creation failed:", error);
    return res.status(502).json({ error: "Unable to create a Decart session token." });
  }
}
