require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth");
const photoRoutes = require("./routes/photos");
const feedRoutes = require("./routes/feed");
const profileRoutes = require("./routes/profile");
const aiRoutes = require("./routes/ai");
const notifRoutes = require("./routes/notifications");
const challengesRoutes = require("./routes/challenges");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

app.use("/api/auth", authRoutes);
app.use("/api/photos", photoRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/notifications", notifRoutes);
app.use("/api/challenges", challengesRoutes);

app.get("/health", (req, res) => res.json({ status: "OK" }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Server xatosi", error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server ${PORT} portda ishlamoqda`));
