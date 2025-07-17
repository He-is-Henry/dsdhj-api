const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewsController");
const verifyJWT = require("../middleware/verifyJWT");
const verifyRoles = require("../middleware/verifyRoles");

router
  .route("/")
  .post(verifyJWT, reviewController.addReview)
  .get(reviewController.getAllReviews);

router.get("/audit", verifyJWT, reviewController.auditReviews);
router
  .route("/:id")
  .patch(verifyJWT, verifyRoles("admin"), reviewController.verifyReview)
  .delete(verifyJWT, reviewController.deleteReview);

module.exports = router;
