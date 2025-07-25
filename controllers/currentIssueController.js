const CurrentIssue = require("../models/CurrentIssue");

const getNewIssue = async (req, res) => {
  const { issue } = req.body;
  const currentIssue = await CurrentIssue.findOne({}).lean();
  let result;

  if (issue) {
    const doc = await CurrentIssue.findOne();
    doc.issue = Number(issue);
    result = await doc.save();
  } else {
    result = await CurrentIssue.updateOne({}, { $inc: { issue: 1 } });
  }

  res.json(result);
};

const getCurrentIssue = async (req, res) => {
  const { issue, active } = await CurrentIssue.findOne({}).lean();
  res.json({ issue, active });
};

const toggleIssueStatus = async (req, res) => {
  const currentIssue = await CurrentIssue.findOne({});
  currentIssue.active = !currentIssue.active;
  const result = await currentIssue.save();
  res.json(result);
};

module.exports = { getNewIssue, getCurrentIssue, toggleIssueStatus };
