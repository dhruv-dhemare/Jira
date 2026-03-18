require("dotenv").config();

const express = require("express");
const passport = require("./config/passport");

const app = express();

app.use(express.json());
app.use(passport.initialize());

app.use("/auth", require("./routes/authRoutes"));
app.use("/users", require("./routes/userRoutes"));
app.use("/projects", require("./routes/projectRoutes"));
app.use("/members", require("./routes/memberRoutes"));
app.use("/tasks", require("./routes/taskRoutes"));

app.listen(5000, () => {
  console.log("Server running on port 5000");
});