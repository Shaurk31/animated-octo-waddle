const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("running");
});

app.post("/webhook/sendblue", async (req, res) => {
  try {
    console.log("BODY:", JSON.stringify(req.body, null, 2));

    const text = req.body?.content;

    if (!text) {
      return res.sendStatus(200);
    }

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

    if (!reply) {
      return res.sendStatus(200);
    }

    const sendRes = await axios.post(
      "https://api.sendblue.co/api/send-message",
      {
        number: req.body.from_number,
        content: reply,
      },
      {
        headers: {
          "sb-api-key": process.env.SENDBLUE_API_KEY,
          "sb-api-secret": process.env.SENDBLUE_API_SECRET,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Sendblue response:", sendRes.data);

    res.sendStatus(200);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.sendStatus(200);
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});