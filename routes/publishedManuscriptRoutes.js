const express = require("express");
const router = express.Router();
const verifyJWT = require("../middleware/verifyJWT");
const verifyRoles = require("../middleware/verifyRoles");
const publishedManuscriptsController = require("../controllers/publishedManuscriptsController");
const {
  adminCreateManuscript,
} = require("../controllers/manuscriptsController");

router
  .route("/")
  .get(publishedManuscriptsController.getCurrentIssueManuscripts)
  .post(verifyJWT, verifyRoles("admin"), adminCreateManuscript);

router.get("/all", publishedManuscriptsController.getAllManuscripts);
router.get("/recent", publishedManuscriptsController.getRecentManuscripts);
router.get("/:slug", publishedManuscriptsController.getManuscript);
router.patch(
  "/:id",
  verifyJWT,
  verifyRoles("admin"),
  publishedManuscriptsController.updateManuscript,
);
router.delete(
  "/:id",
  verifyJWT,
  verifyRoles("admin"),
  publishedManuscriptsController.deleteManuscript,
);

module.exports = router;
