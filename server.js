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

app.listen(3000, () =>
  console.log("🚀 Server ready at http://localhost:3000/add-card")
);
