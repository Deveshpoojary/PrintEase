require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// Model Schema (for storing user print requests)
const PrintRequestSchema = new mongoose.Schema({
  name: String,
  email: String,
  color: String,
  sides: String,
  copies: Number,
  pages: String,
  specificPages: String,
  comments: String,
  submittedAt: { type: Date, default: Date.now }
});

const PrintRequest = mongoose.model("PrintRequest", PrintRequestSchema);

// Route to submit print request (without file)
app.post("/submit-print-request", async (req, res) => {
  try {
    const { name, email, color, sides, copies, pages, specificPages, comments } = req.body;
    const newRequest = new PrintRequest({ name, email, color, sides, copies, pages, specificPages, comments });
    await newRequest.save();
    res.status(201).json({ message: "Print request submitted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error submitting print request" });
  }
});

// Route to fetch all submitted print requests
app.get("/submitted-requests", async (req, res) => {
  try {
    const requests = await PrintRequest.find().sort({ submittedAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: "Error fetching requests" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
