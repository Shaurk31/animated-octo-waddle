const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("running");
});

app.post("/webhook/sendblue", async (req, res) => {
  try {
    // 🔍 Log full payload for debugging
    console.log("BODY:", JSON.stringify(req.body, null, 2));

    // ✅ Ignore non-message events
    if (req.body.type !== "message.received") {
      console.log("Ignoring event type:", req.body.type);
      return res.sendStatus(200);
    }

    // ✅ Safe extraction (prevents crashes)
    const text = req.body?.data?.message?.text;

    if (!text) {
      console.log("No valid text found");
      return res.sendStatus(200);
    }

    console.log("Incoming text:", text);

    // 🤖 Call OpenAI
    const ai = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: text }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    const reply = ai.data?.choices?.[0]?.message?.content;

    console.log("AI reply:", reply);

    if (!reply) {
      console.log("No reply from OpenAI");
      return res.sendStatus(200);
    }

    // 📤 Send response back via Sendblue
    const sendRes = await axios.post(
      "https://api.sendblue.co/api/send-message",
      {
        number: process.env.USER_PHONE,
        content: reply,
      },
      {
        headers: {
          "sb-api-key": process.env.SENDBLUE_API_KEY,
        },
      }
    );

    console.log("Sendblue response:", sendRes.data);

    // ✅ Always respond 200 to prevent retries
    res.sendStatus(200);
  } catch (err) {
    console.error("ERROR:", err.response?.data || err.message);

    // ⚠️ Still return 200 so Sendblue doesn't retry forever
    res.sendStatus(200);
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
