const CurrentIssue = require("../models/CurrentIssue");
const Manuscript = require("../models/Manuscript");
const sendMail = require("../uttils/sendMail");
const { admin, editor } = require("../config/ROLES_LIST");
const PublishedManuscript = require("../models/PublishedManuscript");
const { generateCustomId } = require("./publishedManuscriptsController");
const {
  submission,
  getStatusUpdateTemplate,
  getMessageTemplate,
  getPublishTemplate,
} = require("../uttils/mailTemplate");
const { validateSlug, isValidSlug, slugify } = require("../uttils/slug");

const addManuscript = async (req, res) => {
  const current = await CurrentIssue.findOne();
  const issue = current.issue;
  if (!req.body)
    return res.status(500).json({ erorr: "Manuscript Details Are Required" });
  const {
    name,
    coAuthors,
    title,
    abstract,
    type,
    file,
    country,
    status,
    references,
    discipline,
    institutionalAddress,
    email,
    affiliation,
  } = req.body;

  const author = req.user.id;

  const manuscript = {
    name,
    coAuthors,
    title,
    abstract,
    type,
    file,
    country,
    status,
    issue,
    author,
    discipline,
    references,
    institutionalAddress,
    email,
    affiliation,
  };

  try {
    const result = await Manuscript.create(manuscript);
    manuscript.id = result._id;
    res.json(result);
  } catch (error) {
    res.json(error.message);
  }

  try {
    await sendMail({
      to: email,
      subject: submission.subject,
      html: submission.html(manuscript.name, manuscript.title),
    });
    await sendMail({
      to: "ese.anibor@domainjournals.com",
      bcc: coAuthors ? coAuthors.map((c) => c.email) : [],
      subject: submission.subject,
      text: `Your manuscript titled "${title}" has been received.`,
      html: submission.html(manuscript.name, manuscript.title),
    });
  } catch (err) {
    console.log(err);
  }
};

const getManuscripts = async (req, res) => {
  const author = req.user.id;
  try {
    const manuscripts = await Manuscript.find({ author }).lean();
    const publishedManuscripts = await PublishedManuscript.find({
      author,
    }).lean();
    res.json({ manuscripts, publishedManuscripts });
  } catch (error) {
    console.log(error);
  }
};
const getManuscript = async (req, res) => {
  const manuscript = req.manuscript;
  if (
    !req.user.roles.includes(admin) &&
    req.access !== "author" &&
    manuscript.status === "screening"
  )
    return res
      .status(400)
      .json({ error: "Not allowed to view this manuscript" });
  try {
    res.json(manuscript);
  } catch (error) {
    console.log(error);
  }
};

const getAllManuscripts = async (req, res) => {
  let query = {};

  if (!req.user.roles?.includes(admin)) {
    query.status = { $ne: "screening" };
  }

  const manuscripts = await Manuscript.find(query);
  res.json(manuscripts);
};

const editManuscript = async (req, res) => {
  const manuscript = req.manuscript;
  const details = req.body;

  const {
    comment = `Updated manuscript`,
    history,
    status,
    edited,
    ...updates
  } = details;

  if (!manuscript)
    return res.status(404).json({ error: "Manuscript not found" });

  const includesPersonalInfo =
    updates.name ||
    updates.email ||
    updates.institutionalAddress ||
    updates.affiliation ||
    updates.coAuthors;

  const isAuthor = manuscript.author.toString() === req.user.id.toString();

  if (!req.user.roles.includes(editor) && includesPersonalInfo && !isAuthor) {
    return res
      .status(400)
      .json({ error: "Editors shouldn't edit personal info" });
  }
  const isPaid = manuscript.status === "paid";
  const isScreening = manuscript.status === "screening";
  const isEditor = req.user.roles.includes(editor);
  const isAdmin = req.user.roles.includes(admin);

  const canEditorUpdate = isPaid && isEditor;
  const canAuthorUpdate = isScreening && isAuthor;

  const fileUpdateForbidden = !canEditorUpdate && !canAuthorUpdate;

  if (!isAdmin && updates.file && fileUpdateForbidden)
    return res.status(400).json({
      error: "Cannot make an edit at this point",
    });

  if (updates.file) manuscript.edited = true;

  if (!isAdmin && (updates.volume || updates.issue)) {
    return res.status(400).json({
      error: "Can't edit volume or issue",
    });
  }

  Object.assign(manuscript, updates);
  manuscript.history.push({ comment: `${comment} - ${req.access}` });
  const result = await manuscript.save();
  res.json(result);
};

const sendManuscriptMessage = async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;

  if (!message || message.trim() === "")
    return res.status(400).json({ error: "Message is required" });

  try {
    const manuscript = await Manuscript.findById(id);
    if (!manuscript)
      return res.status(404).json({ error: "Manuscript not found" });
    const { subject, html } = getMessageTemplate(
      manuscript.name,
      manuscript.title,
      message,
    );
    await sendMail({
      to: manuscript.email,
      subject,
      text: message,
      html,
    });

    await sendMail({
      bcc: manuscript.coAuthors ? manuscript.coAuthors.map((c) => c.email) : [],
      to: manuscript.email,
      subject,
      text: message,
      html,
    });
    manuscript.history.push({ comment: `Message sent by admin` });

    await manuscript.save();

    res.json({ success: true, message: "Message sent and saved." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to send message" });
  }
};

const deleteManuscript = async (req, res) => {
  const manuscript = req.manuscript;
  if (!manuscript)
    return res.status(404).json({ error: "Manuscript not found" });
  const result = await manuscript.deleteOne();

  res.json(result);
};

const handleManuscriptStatusUpdate = async (req, res) => {
  const { id } = req.params;
  const newStatus = req.body.status?.toLowerCase();
  const isAdmin = req.user.roles.includes(admin);
  if (!isAdmin && ["under-review", "paid"].includes(newStatus)) {
    return res.status(403).json({
      error: "Only admins can perform this status update",
    });
  }
  const allowedStatuses = [
    "screening",
    "under-review",
    "accepted",
    "paid",
    "rejected",
  ];
  if (!allowedStatuses.includes(newStatus)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  try {
    const manuscript = await Manuscript.findById(id);
    if (!manuscript) {
      return res.status(404).json({ error: "Manuscript not found" });
    }

    const currentStatus = manuscript.status || "screening";
    if (newStatus === currentStatus)
      return res.status(400).json({ error: "What's the point" });
    const allowedTransitions = {
      screening: ["under-review", "rejected"],
      "under-review": ["accepted", "rejected"],
      accepted: ["paid", "rejected"],
      rejected: ["accepted"],
      paid: [],
    };

    if (
      req.user.id.toString() === manuscript.author.toString() &&
      !req.user.roles.includes(admin)
    )
      return res
        .status(400)
        .json({ error: "Editor shouldn't review their own articles" });
    if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
      return res.status(400).json({
        error: `Cannot move from '${currentStatus}' to '${newStatus}'`,
      });
    }
    manuscript.history.push({
      comment: `status changed from ${currentStatus} to ${newStatus}`,
    });
    manuscript.status = newStatus;
    const result = await manuscript.save();
    const { subject, html, text } = getStatusUpdateTemplate(
      manuscript.name,
      manuscript.title,
      newStatus,
      id,
    );

    await sendMail({
      to: manuscript.email,
      subject,
      text,
      html,
    });

    await sendMail({
      bcc: manuscript.coAuthors.map((c) => c.email),
      to: process.env.EMAIL_USER,
      subject,
      text: "Regarding your manuscript",
      html,
    });

    console.log(`Status updated from ${currentStatus} to ${newStatus}`);

    res.json(result);
  } catch (error) {
    res
      .status(500)
      .json({ error: error.message || "Error publishing manuscript" });
    console.error(error);
  }
};

const createPublishedManuscript = async (
  manuscriptDoc,
  res,
  overrides = {},
) => {
  const currentIssue = await CurrentIssue.findOne({}).lean();

  const manuscript =
    typeof manuscriptDoc.toObject === "function"
      ? manuscriptDoc.toObject()
      : { ...manuscriptDoc };

  Object.assign(manuscript, overrides);

  manuscript.issue = currentIssue.issue;
  manuscript.customId = await generateCustomId();
  if (!manuscript.edited)
    return res.status(403).json({
      error:
        "Re-upload required before publishing, please edit the manuscript file",
    });
  if (manuscript.status !== "paid")
    return res
      .status(400)
      .json({ error: "Can only publish paid manuscripts " });
  manuscript.submittedOn = manuscript.createdAt;

  delete manuscript._id;
  delete manuscript.createdAt;
  delete manuscript.updatedAt;

  const publishedManuscript = await PublishedManuscript.create(manuscript);

  return publishedManuscript;
};
const sendPublishedMail = async (manuscript) => {
  const { subject, html } = getPublishTemplate(
    manuscript.name,
    manuscript.title,
    manuscript.volume,
    manuscript.issue,
  );

  await sendMail({
    to: manuscript.email,
    subject,
    text: "your manuscript has been published",
    html,
  });

  await sendMail({
    bcc: manuscript.coAuthors.map((c) => c.email),
    to: manuscript.email,
    subject,
    text: "Your manuscript has been published",
    html,
  });
};

const publishManuscript = async (req, res) => {
  const { id } = req.params;
  const { slug } = req.body;
  try {
    const manuscriptDoc = await Manuscript.findById(id);
    if (!manuscriptDoc)
      return res.status(404).json({ error: "Manuscript not found" });

    const validSlug = await validateSlug(slug, res);
    if (!validSlug) return;

    manuscriptDoc.slug = validSlug;
    console.log(manuscriptDoc.slug);

    const publishedManuscript = await createPublishedManuscript(
      manuscriptDoc,
      res,
      { slug: validSlug },
    );

    if (!publishedManuscript) return;

    const deletedManuscript = await manuscriptDoc.deleteOne();

    await sendPublishedMail(publishedManuscript);
    res.json({ deleted: deletedManuscript, uploaded: publishedManuscript });
  } catch (error) {
    res
      .status(500)
      .json({ error: error.message || "Error publishing manuscript" });
    console.error(error);
  }
};

const adminCreateManuscript = async (req, res) => {
  const body = req.body;

  const {
    name,
    email,
    affiliation,
    institutionalAddress,
    discipline,
    country,
    title,
    type,
    keywords,
    abstract,
    references,
    customId,
    coAuthors,
    file,
    author,
    volume,
    issue,
    slug,
  } = body;
  const validSlug = await validateSlug(slug, res);
  if (!validSlug) return;

  try {
    const manuscriptData = {
      name,
      email,
      affiliation,
      institutionalAddress,
      discipline,
      country,
      title,
      type,
      keywords,
      abstract,
      references,
      customId,
      coAuthors,
      file,
      author,
      volume,
      issue,
      slug: validSlug,
      status: "paid",
      edited: true,
    };

    const publishedManuscript = await createPublishedManuscript(
      manuscriptData,
      res,
    );

    // createPublishedManuscript already sent an error response
    if (!publishedManuscript) return;

    await sendPublishedMail(publishedManuscript);

    res.json({ uploaded: publishedManuscript });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: error.message || "Error creating manuscript" });
  }
};

module.exports = {
  addManuscript,
  getManuscripts,
  editManuscript,
  deleteManuscript,
  getManuscript,
  getAllManuscripts,
  handleManuscriptStatusUpdate,
  sendManuscriptMessage,
  publishManuscript,
  adminCreateManuscript,
};
