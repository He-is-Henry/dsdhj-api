const ROLES_LIST = require("../config/ROLES_LIST");
const verifyRoles = (...allowedRoles) => {
  const rolesArray = [...allowedRoles];
  const roles = rolesArray.map((role) => ROLES_LIST[role]);
  console.log(roles);
  return async (req, res, next) => {
    if (!req?.user?.roles)
      return res.status(401).json({ error: "No user role" });
    console.log(req.user.roles);
    const matchingRole = roles.find((role) => req.user.roles.includes(role));
    if (!matchingRole) return res.sendStatus(403);

    next();
  };
};

module.exports = verifyRoles;
