const { createClient } = require("@supabase/supabase-js");
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

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

exports.wakeSupabase = async (req, res) => {
  try {
    // This completely bypasses the broken anon gateway mappings and ignores all RLS rules
    const { data, error } = await supabaseAdmin
      .from("heartbeat")
      .select("id")
      .limit(1);

    if (error) throw error;

    return res.json({
      success: true,
      message: "Database pinged successfully via admin service layer!",
      data,
    });
  } catch (err) {
    console.error("Wake administrative bypass failed:", err.message);
    return res.status(500).json({ error: err.message });
  }
};
