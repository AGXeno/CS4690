const jwt = require('jsonwebtoken');

const VALID_TENANTS = ['uvu', 'uofu'];

/**
 * Extracts and validates the tenant from the URL path.
 * Attaches req.tenant.
 */
function tenantExtractor(req, res, next) {
  const tenant = req.params.tenant;
  if (!VALID_TENANTS.includes(tenant)) {
    return res.status(400).json({ error: 'Invalid tenant' });
  }
  req.tenant = tenant;
  next();
}

/**
 * Verifies JWT token from Authorization header.
 * Checks that the token's tenant matches the URL tenant.
 * Attaches req.user with { userId, username, role, tenant }.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided', forceLogin: true });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Cross-tenant check: token tenant must match URL tenant
    if (decoded.tenant !== req.tenant) {
      console.log(
        `[SECURITY] Cross-tenant access attempt: user "${decoded.username}" ` +
        `(tenant: ${decoded.tenant}) tried to access tenant: ${req.tenant}`
      );
      return res.status(403).json({ error: 'Cross-tenant access denied', forceLogin: true });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token', forceLogin: true });
  }
}

module.exports = { tenantExtractor, authenticate };
