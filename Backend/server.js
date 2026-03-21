require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors"); // 🔥 ADD THIS
const passport = require("./config/passport");
const { initSocket } = require("./config/socket");

const app = express();
const server = http.createServer(app);

// 🔥 CORS MIDDLEWARE (VERY IMPORTANT)
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

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
app.use("/inventory", require("./routes/inventoryRoutes"));

server.listen(5000, () => {
  console.log("🚀 Server running on port 5000");
});