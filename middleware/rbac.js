/**
 * Creates middleware that restricts access to specific roles.
 * If the user's role is not in the allowed list:
 *   - Logs the attempt to console
 *   - Returns 403 with forceLogout flag (client will log out + redirect)
 *
 * @param  {...string} allowedRoles - Roles permitted to access the route
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated', forceLogin: true });
    }

    if (!allowedRoles.includes(req.user.role)) {
      console.log(
        `[RBAC] Unauthorized access attempt: user "${req.user.username}" ` +
        `(role: ${req.user.role}, tenant: ${req.user.tenant}) ` +
        `tried to access route requiring [${allowedRoles.join(', ')}]`
      );
      return res.status(403).json({
        error: 'Insufficient permissions',
        forceLogout: true
      });
    }

    next();
  };
}

module.exports = { requireRole };
