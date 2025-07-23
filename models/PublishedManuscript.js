const mongoose = require("mongoose");
const schema = mongoose.Schema;

const publishedManuscriptSchema = new schema(
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
    customId: { type: String, required: true, unique: true },

    coAuthors: [
      {
        name: { type: String, required: true },
        email: { type: String, required: true },
      },
    ],

    file: { type: String, required: true },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
    submittedOn: { type: Date, required: true, default: Date.now() },
    views: { type: Number, default: 0, required: true },
  },

  { timestamps: true }
);

module.exports = mongoose.model(
  "PublishedManuscript",
  publishedManuscriptSchema
);
