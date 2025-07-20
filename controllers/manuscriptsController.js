const { logger } = require("../middleware/logger");
const CurrentIssue = require("../models/CurrentIssue");
const Manuscript = require("../models/Manuscript");
const sendMail = require("../uttils/sendMail");
const { admin, editor, author } = require("../config/ROLES_LIST");
const PublishedManuscript = require("../models/PublishedManuscript");
const { generateCustomId } = require("./publishedManuscriptsController");
const {
  submission,
  getStatusUpdateTemplate,
  getMessageTemplate,
  getPublishTemplate,
} = require("../uttils/mailTemplate");
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
  } = req?.body;
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
    console.log("Manuscript created");
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
      bcc: coAuthors.map((c) => c.email),
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
  console.log(author);
  try {
    const manuscripts = await Manuscript.find({ author }).lean();
    const publishedManuscripts = await PublishedManuscript.find({
      author,
    }).lean();
    console.log({ publishedManuscripts, manuscripts });
    res.json({ manuscripts, publishedManuscripts });
  } catch (error) {
    console.log(error);
  }
};
const getManuscript = async (req, res) => {
  const manuscript = req.manuscript;
  console.log(!req.user.roles.includes(admin), req.access, manuscript.status);
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

  if (!manuscript) res.status(404).json({ error: "Manuscript not found" });
  console.log(
    manuscript.author,
    req.user.id,
    req.user.id === manuscript.author
  );

  const includesPersonalInfo =
    updates.name ||
    updates.email ||
    updates.institutionalAddress ||
    updates.affiliation ||
    updates.coAuthors;
  if (!req.user.roles.includes(admin) && includesPersonalInfo) {
    return res
      .status(400)
      .json({ error: "Editors shouldn't edit personal info" });
  }
  const isPaid = manuscript.status === "paid";
  const isScreening = manuscript.status === "screening";
  const isAuthor = manuscript.author.toString() === req.user.id.toString();
  const isPrivileged =
    req.user.roles.includes(editor) || req.user.roles.includes(admin);

  const fileUpdateForbidden =
    !(isPaid && isPrivileged) && !(isScreening && isAuthor);

  if (updates.file && fileUpdateForbidden)
    return res.status(400).json({
      error: "You shouldn't reupload a manuscript before it's been set to paid",
    });

  if (updates.file) manuscript.edited = true;
  Object.assign(manuscript, updates);
  manuscript.history.push({ comment: `${comment} - ${req.access}` });
  const result = await manuscript.save();
  res.json(result);
};

const sendManuscriptMessage = async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;
  console.log(id);

  if (!message || message.trim() === "")
    return res.status(400).json({ error: "Message is required" });

  try {
    const manuscript = await Manuscript.findById(id);
    if (!manuscript)
      return res.status(404).json({ error: "Manuscript not found" });
    const { subject, html } = getMessageTemplate(
      manuscript.name,
      manuscript.title,
      message
    );
    await sendMail({
      to: manuscript.email,
      subject,
      text: message,
      html,
    });

    await sendMail({
      bcc: manuscript.coAuthors.map((c) => c.email),
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
    res.status(500).json({ error: "Failed to send message" });
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
    id
  );

  await sendMail({
    to: manuscript.email,
    subject,
    text,
    html,
  });

  await sendMail({
    bcc: manuscript.coAuthors.map((c) => c.email),
    to: manuscript.email,
    subject,
    text: "Regarding your manuscript",
    html,
  });

  res.json(result);
};

const publishManuscript = async (req, res) => {
  const { id } = req.params;
  try {
    const currentIssue = await CurrentIssue.findOne({}).lean();

    const manuscriptDoc = await Manuscript.findById(id);
    const manuscript = manuscriptDoc.toObject();
    console.log(manuscript);
    manuscript.issue = currentIssue.issue;
    manuscript.customId = await generateCustomId();
    console.log(manuscript.customId);
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
    const deletedManuscript = await manuscriptDoc.deleteOne();
    res.json({ deleted: deletedManuscript, uploaded: publishedManuscript });
    console.log({ deleted: deletedManuscript, uploaded: publishedManuscript });
    const { subject, html } = getPublishTemplate(
      manuscript.name,
      manuscript.title,
      manuscript.volume,
      manuscript.issue
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
  } catch (error) {
    res
      .status(500)
      .json({ error: error.message || "Error publishing manuscript" });
    console.error(error);
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
};
