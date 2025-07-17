const Manuscript = require("../models/Manuscript");
const { admin, editor } = require("../config/ROLES_LIST");

const verifyManuscriptAccess = async (req, res, next) => {
  const { id } = req.params;

  try {
    const manuscript = await Manuscript.findById(id);

    if (!manuscript) {
      return res.status(404).json({ error: "Manuscript not found" });
    }

    const isAuthor = manuscript.author.toString() === req.user.id.toString();
    const isPrivileged =
      req.user.roles.includes(editor) || req.user.roles.includes(admin);
    if (!isAuthor && !isPrivileged) {
      return res.status(403).json({
        error: "Not allowed to perform any actions on this manuscript",
      });
    }
    console.log(manuscript.status, isPrivileged, isAuthor);
    if (req.method !== "GET") {
      console.log("Not get");
      if (manuscript.status !== "screening" && isAuthor && !isPrivileged)
        return res.status(403).json({
          error:
            "Authors are not allowed to perform any action on a manuscript that's gone past screening",
        });

      if (manuscript.status === "screening" && isPrivileged && !isAuthor)
        return res.status(403).json({
          error:
            "Admins and Editors are not allowed to perform any action on a manuscript on screening",
        });
    }

    req.manuscript = manuscript;
    req.access = isAuthor ? "author" : isPrivileged ? "admin" : null;
    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error checking access" });
  }
};

module.exports = verifyManuscriptAccess;
