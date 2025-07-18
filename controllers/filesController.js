const axios = require("axios");
const path = require("path");
const { getPublicIdFromUrl } = require("../middleware/cloudinaryUploads");
const User = require("../models/User");
const cloudinary = require("cloudinary").v2;

const deleteFileFromCloudinary = async (req, res) => {
  const { url, type } = req.query;
  console.log(url, type);

  if (!url) return res.status(400).json({ error: "File URL is required" });

  const publicId = getPublicIdFromUrl(url);
  const trimExtension = (publicId) => publicId.replace(/\.[^/.]+$/, "");
  const safePublicId = type === "image" ? trimExtension(publicId) : publicId;

  console.log({ safePublicId });
  if (!safePublicId)
    return res.status(400).json({ error: "Could not extract public_id" });

  try {
    const result = await cloudinary.uploader.destroy(safePublicId, {
      resource_type: type || "raw",
    });
    console.log(result);

    if (result.result !== "ok") {
      return res.status(500).json({ error: result.result });
    }

    res.status(200).json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: "Cloudinary error", details: err.message });
  }
};
const downloadFile = async (req, res) => {
  const fileId = req.query.url;

  if (!fileId || !fileId.startsWith("https://res.cloudinary.com")) {
    return res.status(400).json({ error: "Invalid or missing file URL." });
  }
  if (fileId.endsWith(".doc") || fileId.endsWith("docx"))
    return res.status(400).json({ error: "API download not necessary" });
  const rawFilename = path.basename(fileId);

  try {
    const response = await axios.get(fileId, {
      responseType: "arraybuffer",
    });

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${rawFilename}.pdf"`,
    });

    return res.send(response.data);
  } catch (err) {
    console.error("Download error:", err.message);
    return res.status(500).json({ error: "Failed to download file." });
  }
};

const uploadFile = (req, res) => {
  try {
    console.log("Trying to upload file");
    if (!req?.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileUrl = req.file.path;
    console.log(fileUrl);
    const extension = req.body.extension;

    return res.status(200).json({ url: fileUrl, extension });
  } catch (err) {
    console.log("Upload error:", err.stack);
    return res.status(500).json({ error: "Failed to upload file" });
  }
};
const uploadAvatar = async (req, res) => {
  try {
    console.log("Trying to upload file");
    console.log(req.file);
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const fileUrl = req.file.path;
    console.log(fileUrl);
    const user = await User.findById(req?.user?.id);
    user.avatar = fileUrl;
    await user.save();
    return res.status(200).json({ url: fileUrl });
  } catch (err) {
    console.log("Upload error:", err.stack);
    return res.status(500).json({ error: "Failed to upload file" });
  }
};

module.exports = {
  uploadFile,
  uploadAvatar,
  downloadFile,
  deleteFileFromCloudinary,
};
