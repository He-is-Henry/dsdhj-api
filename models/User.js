const mongoose = require("mongoose");
const schema = mongoose.Schema;

const userSchema = new schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  email: { type: String, required: true },
  password: String,
  avatar: String,
  tokens: [String],
  resetjti: String,
  roles: { type: [Number], default: [1234] },
});

module.exports = mongoose.model("User", userSchema);
