require("dotenv").config();
const cookieParser = require("cookie-parser");
const PORT = process.env.PORT || 5000;
const express = require("express");
const cors = require("cors");
const app = express();
const corsOptions = require("./config/corsOptions");
const connectDB = require("./config/dbConn");
const { default: mongoose } = require("mongoose");
const {
  generateCustomId,
} = require("./controllers/publishedManuscriptsController");

connectDB();
console.log(__dirname);

app.use(express.urlencoded({ extended: false }));

app.use(express.json());

app.use(cookieParser());

app.use(cors(corsOptions));

app.get("/ping", (req, res) => {
  res.send(`You're sending  request from ${req.headers["user-agent"]}`);
});

app.use("/users", require("./routes/userRoutes"));
app.use("/manuscripts", require("./routes/manuscriptRoutes"));
app.use("/files", require("./routes/fileRoutes"));
app.use("/newsletter", require("./routes/newsletterRoutes"));
app.use("/messages", require("./routes/messageRoutes"));
app.use("/reviews", require("./routes/reviewRoutes"));
app.use("/issues", require("./routes/currentIssueRoutes"));
app.use("/published", require("./routes/publishedManuscriptRoutes"));
app.use("/archives", require("./routes/archiveRoutes"));

mongoose.connection.once("open", async () => {
  console.log("connected to mongoDB");
  app.listen(PORT, () => console.log("Listening on port", PORT));
});
