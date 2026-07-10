const CurrentIssue = require("../models/CurrentIssue");
const PublishedManuscript = require("../models/PublishedManuscript");
const { validateSlug, isValidSlug, slugify } = require("../uttils/slug");

async function generateCustomId() {
  const year = new Date().getFullYear();
  const prefix = `DSDHJ${year}`;
  const count = await PublishedManuscript.countDocuments({
    customId: { $regex: `^${prefix}` },
  });
  const serial = String(count + 1).padStart(3, "0");
  return `${prefix}${serial}`;
}

const getCurrentIssueManuscripts = async (req, res) => {
  try {
    const currentIssue = await CurrentIssue.findOne();
    if (!currentIssue)
      return res.status(404).json({ error: "No current issue set" });

    const allManuscripts = await PublishedManuscript.find({
      issue: currentIssue.issue,
    });
    res.json(allManuscripts);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Failed to fetch current issue manuscripts" });
  }
};

const getManuscript = async (req, res) => {
  const { slug } = req.params;
  console.log(slug);
  try {
    const manuscript = await PublishedManuscript.findOneAndUpdate(
      { slug },
      { $inc: { views: 1 } },
      { new: true },
    );
    if (!manuscript)
      return res.status(404).json({ error: "Manuscript not found" });

    res.json(manuscript);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch manuscript" });
  }
};

const getRecentManuscripts = async (req, res) => {
  try {
    const manuscripts = await PublishedManuscript.find()
      .sort({ createdAt: -1 })
      .limit(3);
    res.json(manuscripts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch recent manuscripts" });
  }
};

const getAllManuscripts = async (req, res) => {
  try {
    const manuscripts = await PublishedManuscript.find();
    res.json(manuscripts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch manuscripts" });
  }
};

const updateManuscript = async (req, res) => {
  const { id } = req.params;
  const { customId, views, createdAt, updatedAt, ...updates } = req.body;

  try {
    const manuscript = await PublishedManuscript.findById(id);
    if (!manuscript)
      return res.status(404).json({ error: "Manuscript not found" });

    if (updates.slug) {
      const validSlug = await validateSlug(updates.slug, res, id); // exclude self from uniqueness check
      if (!validSlug) return;
      updates.slug = validSlug;
    }

    Object.assign(manuscript, updates);
    const result = await manuscript.save();
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update manuscript" });
  }
};

const deleteManuscript = async (req, res) => {
  const { id } = req.params;
  try {
    const manuscript = await PublishedManuscript.findById(id);
    if (!manuscript)
      return res.status(404).json({ error: "Manuscript not found" });

    const result = await manuscript.deleteOne();
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete manuscript" });
  }
};

module.exports = {
  getAllManuscripts,
  getRecentManuscripts,
  generateCustomId,
  getCurrentIssueManuscripts,
  getManuscript,
  updateManuscript,
  deleteManuscript,
};
