const Archive = require("../models/Archive");
const CurrentIssue = require("../models/CurrentIssue");

const addNewArchive = async (req, res) => {
  const { volume, issue, file } = req.body;
  if (isNaN(volume) || isNaN(issue))
    return res.status(400).json({ error: "Invalid volume or issue" });
  const alreadyExistingArchive = await Archive.findOne({ volume, issue });
  if (alreadyExistingArchive) await alreadyExistingArchive.deleteOne();
  await Archive.create({ volume, issue, file });
  const message = alreadyExistingArchive
    ? `Successfully replaced archive in volume ${volume}, issue ${issue}`
    : "Successfully created archive record for volume ${volume}, issue ${issue}";

  res.json(message);
};

const getAllArchives = async (req, res) => {
  const archiveList = await Archive.find();
  res.json(archiveList);
};

const getCurrentIssueArchive = async (req, res) => {
  try {
    const latestVolDoc = await Archive.findOne().sort({ volume: -1 }).limit(1);
    if (!latestVolDoc)
      return res.status(404).json({ error: "No archive found" });

    const latestVolume = latestVolDoc.volume;

    const latestIssueDoc = await Archive.findOne({ volume: latestVolume })
      .sort({ issue: -1 })
      .limit(1);

    if (!latestIssueDoc)
      return res.status(404).json({ error: "No issue found in latest volume" });

    res.json(latestIssueDoc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { addNewArchive, getAllArchives, getCurrentIssueArchive };
