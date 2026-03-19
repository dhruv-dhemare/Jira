require("dotenv").config();

const express = require("express");
const http = require("http");
const passport = require("./config/passport");
const { initSocket } = require("./config/socket");

const app = express();
const server = http.createServer(app);


const io = initSocket(server);

app.use(express.json());
app.use(passport.initialize());

// Routes
app.use("/auth", require("./routes/authRoutes"));
app.use("/users", require("./routes/userRoutes"));
app.use("/projects", require("./routes/projectRoutes"));
app.use("/members", require("./routes/memberRoutes"));
app.use("/tasks", require("./routes/taskRoutes"));
app.use("/notifications", require("./routes/notificationRoutes"));

server.listen(5000, () => {
  console.log("🚀 Server running on port 5000");
});