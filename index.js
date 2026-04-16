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
    console.log("BODY:", JSON.stringify(req.body, null, 2));

    // ✅ Correct extraction for YOUR payload
    const text = req.body?.content;

    if (!text) {
      console.log("No message content found");
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
      return res.sendStatus(200);
    }

    // 📤 Send reply back
    const sendRes = await axios.post(
      "https://api.sendblue.co/api/send-message",
      {
        number: req.body.from_number, // 🔥 reply to sender
        content: reply,
      },
      {
        headers: {
          "sb-api-key": process.env.SENDBLUE_API_KEY,
        },
      }
    );

    console.log("Sendblue response:", sendRes.data);

    res.sendStatus(200);
  } catch (err) {
    console.error("ERROR:", err.response?.data || err.message);
    res.sendStatus(200);
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
