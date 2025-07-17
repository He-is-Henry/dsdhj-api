const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  read: { type: Boolean, default: false },
  message: { type: String, required: true },
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  email: { type: String, required: true },
});

module.exports = mongoose.model("Message", messageSchema);
