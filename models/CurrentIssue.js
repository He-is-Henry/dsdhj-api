const mongoose = require("mongoose");

const currentIssueSchema = new mongoose.Schema({
  issue: { type: Number, required: true },
  active: { type: Boolean, default: true, required: true },
});

module.exports = mongoose.model("CurrentIssue", currentIssueSchema);
