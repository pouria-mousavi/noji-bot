const express = require("express");
const { addFlashcard } = require("./addFlashcards.js");
const app = express();
require("dotenv").config();
app.use(express.json());

app.post("/add-card", async (req, res) => {
  const { question, answer } = req.body;

  if (!question || !answer) {
    return res.status(400).json({ error: "Missing question or answer" });
  }

  try {
    await addFlashcard({ question, answer });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server ready at http://0.0.0.0:${PORT}/add-card`);
});
