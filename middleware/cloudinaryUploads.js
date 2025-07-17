const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "manuscripts",
    resource_type: "raw",
    format: undefined,
    public_id: (req, file) => {
      const timestamp = Date.now();
      const originalExt =
        req.body.extension || file.originalname.split(".").pop();
      console.log("From cloudinary settings", file);
      const originalName = file.originalname.split(".")[0];
      console.log(originalExt);
      const name = `${originalName}_${timestamp}${
        originalExt !== "pdf" ? "." + originalExt : ""
      }`;
      console.log(name);
      return name;
    },
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "error: Invalid file type. Only .doc, .docx, and .pdf are allowed."
      ),
      false
    );
  }
};

const getPublicIdFromUrl = (url) => {
  try {
    const parts = url.split("/upload/")[1];
    const withoutVersion = parts.split("/").slice(1).join("/");
    return withoutVersion;
  } catch (err) {
    console.error("Invalid Cloudinary URL:", url);
    return null;
  }
};

const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "avatars",
    resource_type: "image",
  },
});

const upload = multer({ storage, fileFilter });
const uploadImage = multer({ storage: imageStorage });

module.exports = { upload, uploadImage, getPublicIdFromUrl };
