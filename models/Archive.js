const mongoose = require("mongoose");
const schema = mongoose.Schema;

const archiveSchema = new schema({
  volume: { type: Number, required: true },
  issue: { type: Number, required: true },
  file: { type: String, required: true },
});

module.exports = mongoose.model("archive", archiveSchema);
