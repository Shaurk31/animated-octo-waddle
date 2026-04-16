const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

app.post("/webhook/sendblue", async (req, res) => {
  try {
    const text = req.body.data.message.text;

    console.log("Incoming:", text);

    // call OpenAI
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

    const reply = ai.data.choices[0].message.content;

    // send back via Sendblue
    await axios.post(
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

    res.json({ success: true });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send("error");
  }
});

app.get("/", (req, res) => {
  res.send("running");
});

app.listen(process.env.PORT || 3000);