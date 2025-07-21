const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const ROLES_LIST = require("../config/ROLES_LIST");
const sendMail = require("../uttils/sendMail");
const { admin, editor, author } = require("../config/ROLES_LIST");

const signup = async (req, res) => {
  const { firstname, lastname, email, password } = req?.body;
  const emailAlreadyExists = await User.findOne({ email });
  if (emailAlreadyExists)
    return res.status(409).json({ error: "Email already exists" });
  const hashed = await bcrypt.hash(password, 10);
  try {
    const user = await User.create({
      firstname,
      lastname,
      email,
      password: hashed,
    });
    res.json("User created", user);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

const login = async (req, res) => {
  const { email, password } = req?.body;
  if (!email || !password)
    return res.status(400).json({ error: "Password and email are required" });
  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({
        error: `User with the email: "${email}" doesn't exist`,
      });
    if (user.password === undefined)
      return res.json.status(401)({ error: "Account not activated" });
    const matchingPassword = await bcrypt.compare(password, user.password);

    if (!matchingPassword)
      return res.status(400).json({ error: "Incorrect password, try again" });
    const token = jwt.sign(
      {
        id: user._id,
        roles: user.roles,
      },
      process.env.TOKEN_SECRET,
      {
        expiresIn: "365d",
      }
    );
    const previousToken = req?.cookies?.jwt;
    if (previousToken) {
      res.clearCookie("jwt", { httpOnly: true });
      user.tokens = user.tokens.filter((t) => t !== previousToken);
    }
    user.tokens.push(token);
    await user.save();
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 60 * 60 * 24 * 365 * 1000,
    });
    const roles = user.roles
      .map((roleId) => {
        const roleName = Object.keys(ROLES_LIST).find(
          (key) => ROLES_LIST[key] === roleId
        );
        return roleName;
      })
      .filter(Boolean);
    res.json({
      message: "access granted",
      user: {
        firstname: user.firstname,
        lastname: user.lastname,
        token,
        roles,
        avatar: user.avatar,
        email: user.email,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message || "Login failed" });
  }
};

const getCurrentUser = async (req, res) => {
  const id = req.user.id;
  console.log(id);
  const user = await User.findById(id).select("-password -tokens").lean();
  user.roles = user.roles
    .map((roleId) => {
      const roleName = Object.keys(ROLES_LIST).find(
        (key) => ROLES_LIST[key] === roleId
      );
      console.log(roleName);
      return roleName;
    })
    .filter(Boolean);
  res.json(user);
};

const logout = async (req, res) => {
  const jwt = req?.cookies?.jwt;
  if (!jwt) {
    return res.status(400).json({ message: "No token" });
  }
  const user = await User.findOne({ tokens: jwt });
  console.log("tokens: ", user.tokens);
  console.log("JWT: ", jwt);
  user.tokens = user.tokens.filter((token) => token !== jwt);
  await user.save();

  res
    .clearCookie("jwt", { httpOnly: true })
    .json({ message: "successfully logged out" });
};

const getAllUsers = async (req, res) => {
  const users = await User.find().select("-password").lean();
  const userWithTextRoles = users.map((user) => {
    const textRoles = user.roles
      .map((roleId) => {
        const role = Object.keys(ROLES_LIST).find(
          (key) => ROLES_LIST[key] === roleId
        );
        return role;
      })
      .filter(Boolean);

    return {
      ...user,
      roles: textRoles,
    };
  });

  console.log(userWithTextRoles);
  res.json(userWithTextRoles);
};

const handleInvite = async (req, res) => {
  const { email, role } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email required" });
  }
  const rolesArray =
    role === "admin" ? [author, admin, editor] : [author, editor];
  const roleIndex = Object.keys(ROLES_LIST).find(
    (roleName) => roleName === role
  );

  if (!roleIndex) res.status(400).json({ error: "invalid role" });

  const userRole = ROLES_LIST[roleIndex];

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "User already exists" });
    }

    const user = await User.create({
      firstname: "Unverified",
      lastname: "User",
      email,
      role: rolesArray,
      password: undefined,
    });

    const inviteToken = jwt.sign(
      { userData: { id: user._id, role: userRole } },
      process.env.TOKEN_SECRET,
      {
        expiresIn: "2d",
      }
    );

    const link = `${process.env.FRONTEND_URL}/invite/${inviteToken}`;

    await sendMail({
      to: email,
      subject: "You're Invited",
      text: `You're invited to Delta State Dental And Health Journal Admin Panel. Click to join: ${link}`,
      html: `<p>You've been invited to join the Delta State Dental and Health Journal Admin Panel as <strong>${role}</strong>.</p>
             <p><a href="${link}">Click here to set up your account</a></p>
             <p>This link will expire in 2 days.</p>`,
    });

    res.status(200).json({ message: "Invitation sent", userId: user._id });
  } catch (err) {
    console.error("Invite error:", err.stack);
    res.status(500).json({ error: "Could not send invite" });
  }
};

const completeInvite = async (req, res) => {
  const { token } = req.params;
  const { firstname, lastname, password } = req.body;

  if (!token || !firstname || !lastname || !password) {
    return res.status(400).json({ error: "Missing token, name or password" });
  }

  if (password.length < 8)
    return res
      .status(400)
      .json({ error: "Password length cannot be less than 8" });

  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    const userId = decoded.userData.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.password) {
      return res.status(400).json({ error: "Account already activated" });
    }

    user.firstname = firstname;
    user.lastname = lastname;
    user.password = await bcrypt.hash(password, 10);
    await user.save();

    res.status(200).json({ success: "Account setup complete" });
  } catch (err) {
    console.log("Invite acceptance failed:", err.stack);
    res.status(401).json({ error: "Invalid or expired invite link" });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  if (!id) res.status(400).json({ error: "ID is required" });
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ error: "User not found" });
  if (user.roles.includes(admin))
    return res.status(403).json({ error: "You can't delete a fellow admin" });
  if (req.user.id.toString() === id.toString())
    return res.status(400).json({ error: "You cannot delete yourself" });
  const result = await user.deleteOne();
  res.json(result);
};

const handleNewRole = async (req, res) => {
  const { id } = req.params;
  if (!id) res.status(400).json({ error: "ID is required" });

  const { role } = req.body;
  const allowedRoles = ["admin", "editor"];
  if (!allowedRoles.includes(role))
    return res.status(400).json({ error: "Invalid role" });
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ error: "User not found" });

  const roleCode = ROLES_LIST[role];
  if (user.roles.includes(roleCode))
    return res.status(400).json({ error: `User is already an ${role}` });
  user.roles.push(roleCode);
  const result = await user.save();
  res.json(result);
};

const handleRemoveRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const allowedRoles = ["admin", "editor"];
  if (role === "author")
    res
      .status(400)
      .json({ error: "Cannot remove author's status, delete instead!" });
  if (!allowedRoles.includes(role))
    return res.status(400).json({ error: "Invalid role" });
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ error: "User not found" });
  if (user.roles.includes(admin))
    res.status(401).json({ error: "You cannot demote an admin" });
  const roleCode = ROLES_LIST[role];
  if (!user.roles.includes(roleCode))
    return res.status(400).json({ error: `User is not an ${role}` });
  user.roles = user.roles.filter((roleId) => roleId !== roleCode);
  const result = await user.save();
  res.json(result);
};

const sendResetLink = async (req, res) => {
  const { email } = req.body;
  if (!email) res.status(400).json({ error: "Email is required" });
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: "User not found" });
  const jti = crypto.randomUUID();
  const resetToken = jwt.sign(
    { userId: user._id, jti },
    process.env.TOKEN_SECRET,
    { expiresIn: "10m" }
  );
  user.resetjti = jti;
  await user.save();
  const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  await sendMail({
    to: email,
    subject: "Password Reset Request",
    text: `Click the link to reset your password: ${resetLink}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Password Reset</h2>
        <p>You requested a password reset. Click the button below to reset it:</p>
        <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>This link will expire in 10 minutes.</p>
        <p>If you didn't request this, you can ignore this email.</p>
      </div>
    `,
  });

  res.json({ message: "Password reset link sent" });
};

const verifyReset = async (req, res) => {
  const { password, token } = req.body;
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.TOKEN_SECRET);
  } catch (err) {
    return res.status(401).json({ error: "Incorrect or expired token" });
  }
  const jti = decoded.jti;
  const userId = decoded.userId;
  if (!jti) return res.status(401).json({ error: "Incorrect token" });
  const user = await User.findById(userId);
  if (user.resetjti !== jti)
    return res.status(403).json({ error: "This link has been used" });
  user.password = await bcrypt.hash(password, 10);
  user.resetjti = "";
  await user.save();
  res.json({ success: "Successfully reset password in" });
};
module.exports = {
  signup,
  login,
  getCurrentUser,
  logout,
  getAllUsers,
  handleInvite,
  completeInvite,
  deleteUser,
  handleNewRole,
  handleRemoveRole,
  verifyReset,
  sendResetLink,
};
