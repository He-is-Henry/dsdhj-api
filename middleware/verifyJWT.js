const jwt = require("jsonwebtoken");
const User = require("../models/User");
const verifyJWT = async (req, res, next) => {
  const cookies = req?.cookies;
  if (!cookies) return res.status(401).json({ error: "No cookies found" });
  const token = cookies?.jwt;
  if (!token) return res.status(401).json({ error: "Token doesn't exist" });

  const user = await User.findOne({ tokens: token });
  if (!user) {
    return res
      .clearCookie("jwt", { httpOnly: true })
      .status(401)
      .json({ error: "Token isn't in DB" });
  }
  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    if (!decoded) return res.sendStatus(401);
    console.log(decoded);
    req.user = {
      id: user._id,
      roles: user.roles,
      name: `${user.firstname} ${user.lastname}`,
    };
  } catch (err) {
    console.log(err);
  }
  next();
};

module.exports = verifyJWT;
