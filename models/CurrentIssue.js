const mongoose = require("mongoose");

const currentIssueSchema = new mongoose.Schema({
  issue: { type: Number, required: true },
});

module.exports = mongoose.model("CurrentIssue", currentIssueSchema);
