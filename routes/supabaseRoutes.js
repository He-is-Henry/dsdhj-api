const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/supabaseController");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

// Upload
router.post("/upload", upload.single("file"), ctrl.uploadPdf);

// Delete
router.post("/delete", ctrl.deletePdf);

// Get URL
router.post("/url", ctrl.getPdfUrl);

// Wake (cron job hits this)
router.get("/wake", ctrl.wakeSupabase);

module.exports = router;
