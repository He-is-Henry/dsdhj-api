const express = require("express");
const router = express.Router();
const { upload, uploadImage } = require("../middleware/cloudinaryUploads");
const filesController = require("../controllers/filesController");
const verifyJWT = require("../middleware/verifyJWT");

router.post("/manuscript", upload.single("file"), filesController.uploadFile);
router.post(
  "/avatar",
  verifyJWT,
  uploadImage.single("avatar"),
  filesController.uploadAvatar
);
router.get("/download", filesController.downloadFile);
router.delete("/delete", filesController.deleteFileFromCloudinary);

module.exports = router;
