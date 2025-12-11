require("dotenv").config();
const express = require("express");
const { resolve } = require("path");
const cors = require("cors");
const connectDB = require("./config/database"); // Import the function
const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");

const app = express();
const port = process.env.PORT || 3010;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("static"));

app.get("/", (req, res) => {
  res.sendFile(resolve(__dirname, "pages/index.html"));
});

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Connect to DB first, THEN start server
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Chat API server listening at http://localhost:${port}`);
  });
});
