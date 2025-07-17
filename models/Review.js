const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reviewSchema = Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  dateTime: { type: Date, default: new Date().toISOString() },
  text: { type: String, required: true },
  verified: { type: Boolean, required: true, default: false },
});

module.exports = mongoose.model("Review", reviewSchema);
