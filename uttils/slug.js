const PublishedManuscript = require("../models/PublishedManuscript");

const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const isValidSlug = (slug) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);

const validateSlug = async (slug, res, excludeId = null) => {
  if (!slug || !slug.trim()) {
    res.status(400).json({ error: "Slug is required" });
    return false;
  }
  const cleaned = slugify(slug);
  if (!isValidSlug(cleaned)) {
    res.status(400).json({
      error: "Slug must be lowercase letters, numbers, and hyphens only",
    });
    return false;
  }
  const query = { slug: cleaned };
  if (excludeId) query._id = { $ne: excludeId };
  const existing = await PublishedManuscript.findOne(query);
  if (existing) {
    res.status(409).json({ error: "This slug is already in use" });
    return false;
  }
  return cleaned;
};

module.exports = {
  slugify,
  isValidSlug,
  validateSlug,
};
