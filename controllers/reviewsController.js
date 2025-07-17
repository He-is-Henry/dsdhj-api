const Review = require("../models/Review");

const addReview = async (req, res) => {
  try {
    const review = req.body;
    if (!review) return res.status(400).json({ error: "Review is required" });
    if (review.text.length > 300)
      return res.status(400).json({ error: "Character limit exceeded" });

    review.user = req.user.id;
    const result = await Review.create(review);
    res.status(201).json(result);
  } catch (err) {
    console.error("Error adding review:", err);
    res.status(500).json({ error: "Failed to add review" });
  }
};

const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ verified: true }).populate({
      path: "user",
      select: "firstname lastname avatar",
    });
    res.json(reviews);
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const auditReviews = async (req, res) => {
  try {
    const reviews = await Review.find().populate({
      path: "user",
      select: "firstname lastname avatar",
    });
    console.log(reviews);
    res.json(reviews);
  } catch (err) {
    console.error("Error auditing reviews:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const verifyReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ error: "Review not found" });

    review.verified = true;
    const result = await review.save();
    res.json(result);
  } catch (err) {
    console.error("Error verifying review:", err);
    res.status(500).json({ error: "Failed to verify review" });
  }
};

const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Review.findByIdAndDelete(id);
    if (!result) return res.status(404).json({ error: "Review not found" });

    res.json(result);
  } catch (err) {
    console.error("Error deleting review:", err);
    res.status(500).json({ error: "Failed to delete review" });
  }
};

module.exports = {
  addReview,
  auditReviews,
  getAllReviews,
  verifyReview,
  deleteReview,
};
