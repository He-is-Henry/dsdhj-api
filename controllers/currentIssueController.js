const CurrentIssue = require("../models/CurrentIssue");

const getNewIssue = async (req, res) => {
  const { issue } = req.body;
  const currentIssue = await CurrentIssue.findOne({}).lean();
  console.log(currentIssue);
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
  const { issue, status } = await CurrentIssue.findOne({}).lean();
  console.log(issue);
  res.json({ issue, status });
};

const toggleIssueStatus = async () => {
  const currentIssue = await CurrentIssue.findOne({}).lean();
  currentIssue.active = !currentIssue.active;
  currentIssue.save();
};

module.exports = { getNewIssue, getCurrentIssue, toggleIssueStatus };
