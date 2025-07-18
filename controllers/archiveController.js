const Archive = require("../models/Archive");

const addNewArchive = async (req, res) => {
  const { volume, issue, file } = req.body;
  const alreadyExistingArchive = await Archive.find({ volume, issue });
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

module.exports = { addNewArchive, getAllArchives };
