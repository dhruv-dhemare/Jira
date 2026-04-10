require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const passport = require("./config/passport");
const { initSocket } = require("./config/socket");

const app = express();
const server = http.createServer(app);

// 🔥 ENHANCED CORS MIDDLEWARE (Brave/Edge compatible)
const corsOptions = {
  // Allow multiple origins (development + production)
  origin: [
    "https://sprint-hub.netlify.app",        // Production
    "http://localhost:5173",                 // Local dev (Vite)
    "http://localhost:3000",                 // Alternative dev
    "http://127.0.0.1:5173",                 // Loopback
    process.env.FRONTEND_URL || "",          // Env variable for flexibility
  ].filter(Boolean),
  credentials: true,                         // Allow cookies/auth
  methods: ["GET", "POST", "PATCH", "DELETE", "PUT", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// 🔥 Additional headers for Brave/Edge compatibility
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || corsOptions.origin[0]);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,PUT,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
  
  // Preflight OPTIONS requests
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(passport.initialize());

const io = initSocket(server);

// Routes
app.use("/auth", require("./routes/authRoutes"));
app.use("/users", require("./routes/userRoutes"));
app.use("/projects", require("./routes/projectRoutes"));
app.use("/members", require("./routes/memberRoutes"));
app.use("/tasks", require("./routes/taskRoutes"));
app.use("/notifications", require("./routes/notificationRoutes"));
app.use("/competitions", require("./routes/competitionRoutes"));
app.use("/inventory", require("./routes/inventoryRoutes"));
app.use("/sprints", require("./routes/sprintRoutes"));

server.listen(5000, () => {
  console.log("🚀 Server running on port 5000");
});