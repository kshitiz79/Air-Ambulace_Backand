const SystemLog = require('../model/SystemLog');
const User = require('../model/User');

// Map HTTP method + path to action + resource
const resolveActionResource = (method, path) => {
  const parts = path.replace(/^\/api\//, '').split('/');
  const resource = parts[0] || 'system';
  const resourceId = parts[1] && !isNaN(parts[1]) ? parts[1] : null;

  let action;
  switch (method) {
    case 'POST':   action = 'CREATE'; break;
    case 'PUT':
    case 'PATCH':  action = 'UPDATE'; break;
    case 'DELETE': action = 'DELETE'; break;
    case 'GET':    action = 'VIEW';   break;
    default:       action = method;
  }

  // Special sub-actions from path segments
  if (parts[2] === 'approve' || parts[2] === 'reject') action = 'UPDATE';
  if (parts[2] === 'forward') action = 'UPDATE';
  if (parts[2] === 'escalate') action = 'UPDATE';
  if (parts[2] === 'change-password') action = 'UPDATE';

  return { action, resource: resource.replace(/-/g, '_'), resourceId };
};

const getIp = (req) =>
  req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
  req.socket?.remoteAddress ||
  'unknown';

// Async fire-and-forget logger — never blocks the request
const logActivity = async ({
  user_id, username, role, action, resource, resource_id,
  description, ip_address, user_agent, status, method, endpoint,
}) => {
  try {
    await SystemLog.create({
      event_type: `${action}_${resource}`.toUpperCase(),
      description,
      user_id: user_id || null,
      username: username || null,
      role: role || null,
      action,
      resource,
      resource_id: resource_id ? String(resource_id) : null,
      ip_address,
      user_agent: user_agent ? user_agent.substring(0, 500) : null,
      status: status || 'SUCCESS',
      method,
      endpoint,
    });
  } catch (err) {
    // Never crash the app due to logging failure
    console.error('[ActivityLogger] Failed to write log:', err.message);
  }
};

// Express middleware — attaches to all routes
const activityLoggerMiddleware = (req, res, next) => {
  // Skip GET requests (too noisy) and auth routes (handled separately)
  const skipMethods = ['GET', 'OPTIONS', 'HEAD'];
  const skipPaths = ['/api/auth/login', '/api/auth/logout', '/api/auth/forgot-password', '/api/auth/verify-otp', '/api/auth/reset-password'];

  if (skipMethods.includes(req.method) || skipPaths.includes(req.path)) {
    return next();
  }

  const originalJson = res.json.bind(res);
  const startTime = Date.now();

  res.json = function (body) {
    const { action, resource, resourceId } = resolveActionResource(req.method, req.path);
    const user = req.user;
    const isSuccess = res.statusCode < 400;

    // Extract resource_id from response body or URL params
    const resolvedResourceId =
      req.params?.id ||
      body?.data?.enquiry_id ||
      body?.data?.user_id ||
      body?.data?.hospital_id ||
      body?.data?.log_id ||
      resourceId;

    // Build human-readable description
    const who = user ? `${user.username || 'User#' + user.user_id} (${user.role})` : 'Anonymous';
    const what = `${action} ${resource}${resolvedResourceId ? ' #' + resolvedResourceId : ''}`;
    const description = `${who} performed ${what} via ${req.method} ${req.path}`;

    logActivity({
      user_id: user?.user_id,
      username: user?.username,
      role: user?.role,
      action,
      resource,
      resource_id: resolvedResourceId,
      description,
      ip_address: getIp(req),
      user_agent: req.headers['user-agent'],
      status: isSuccess ? 'SUCCESS' : 'FAILED',
      method: req.method,
      endpoint: req.path,
    });

    return originalJson(body);
  };

  next();
};

// Standalone function for manual logging (used in auth controller)
const log = logActivity;

module.exports = { activityLoggerMiddleware, log, getIp };
