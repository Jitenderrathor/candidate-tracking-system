const success = (res, { statusCode = 200, message = 'Success', data = null, meta } = {}) => {
  const body = { success: true, message, data };
  if (meta !== undefined) body.meta = meta;
  return res.status(statusCode).json(body);
};

const failure = (res, { statusCode = 500, message = 'Internal server error', code, details } = {}) => {
  const error = { message };
  if (code !== undefined) error.code = code;
  if (details !== undefined) error.details = details;
  return res.status(statusCode).json({ success: false, error });
};

module.exports = { success, failure };

