const { supabase } = require("../config/supabase");

const BUCKET = process.env.SUPABASE_BUCKET;

exports.uploadPdf = async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: "No file selected" });

  const fileName = `${Date.now()}_${file.originalname
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "")}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
    });

  if (error) return res.status(500).json({ error: error.message });

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);

  res.json({
    url: data.publicUrl,
    path: fileName,
  });
};

exports.deletePdf = async (req, res) => {
  const { filePath } = req.body;

  const { error } = await supabase.storage.from(BUCKET).remove([filePath]);

  if (error) return res.status(500).json({ error: error.message });

  res.json({ success: true });
};

exports.getPdfUrl = (req, res) => {
  const { filePath } = req.body;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

  res.json({ url: data.publicUrl });
};

exports.wakeSupabase = async (req, res) => {
  const { error, data } = await supabase.storage
    .from(BUCKET)
    .list("", { limit: 1 });

  if (error) return res.status(500).json({ error: error.message });

  res.json({ success: true, data });
};
