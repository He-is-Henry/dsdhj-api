const CurrentIssue = require("../models/CurrentIssue");
const PublishedManuscript = require("../models/PublishedManuscript");

async function generateCustomId() {
  const year = new Date().getFullYear();
  const prefix = `DSDHJ${year}`;
  const count = await PublishedManuscript.countDocuments({
    customId: { $regex: `^${prefix}` },
  });
  const serial = String(count + 1).padStart(3, "0");
  console.log(`${prefix}${serial}`);
  return `${prefix}${serial}`;
}

const getCurrentIssueManuscripts = async (req, res) => {
  const { issue } = await CurrentIssue.findOne();
  const allManuscripts = await PublishedManuscript.find({ issue });
  res.json(allManuscripts);
};

const getManuscript = async (req, res) => {
  const { id } = req.params;
  const manuscript = await PublishedManuscript.findById(id);
  manuscript.views = manuscript.views + 1;
  await manuscript.save();
  res.json(manuscript);
};

const getRecentManuscripts = async (req, res) => {
  const manuscripts = await PublishedManuscript.find().limit(3);
  res.json(manuscripts);
};
module.exports = {
  getRecentManuscripts,
  generateCustomId,
  getCurrentIssueManuscripts,
  getManuscript,
};
