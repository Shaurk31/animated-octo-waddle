const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("running");
});

app.post("/webhook/sendblue", async (req, res) => {
  try {
    const text = req.body?.content;
    const user = req.body?.from_number;

    if (!text || !user) {
      return res.sendStatus(200);
    }

    const ai = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: text }]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );

    const reply = ai.data?.choices?.[0]?.message?.content;

    if (!reply) {
      return res.sendStatus(200);
    }

    await axios({
      method: "post",
      url: "https://api.sendblue.com/api/send-message",
      headers: {
        "sb-api-key-id": process.env.SENDBLUE_API_KEY,
        "sb-api-secret-key": process.env.SENDBLUE_API_SECRET,
        "Content-Type": "application/json"
      },
      data: {
        number: user,
        from_number: process.env.SENDBLUE_PHONE,
        content: reply
      }
    });

    res.sendStatus(200);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.sendStatus(200);
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT);