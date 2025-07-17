const mongoose = require("mongoose");
const schema = mongoose.Schema;

const manuscriptSchema = new schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    affiliation: { type: String, required: true },
    institutionalAddress: { type: String, required: true },
    discipline: { type: String, required: true },
    country: { type: String, required: true },

    title: { type: String, required: true },
    type: { type: String, required: true },
    keywords: { type: [String], required: true, default: [] },
    abstract: { type: String, required: true },
    references: { type: String, required: true },

    coAuthors: [
      {
        name: { type: String, required: true },
        email: { type: String, required: true },
      },
    ],
    file: { type: String, required: true },
    edited: { type: Boolean, default: false },
    history: [
      {
        comment: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        readBy: [
          { type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] },
        ],
      },
    ],
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Author",
      required: true,
    },

    status: {
      type: String,
      required: true,
      enum: ["screening", "under-review", "accepted", "paid", "rejected"],
      default: "screening",
    },

    volume: {
      type: Number,
      required: true,
      default: new Date().getFullYear() - 2022,
    },

    issue: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Manuscript", manuscriptSchema);
