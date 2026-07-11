const express = require('express');
const asyncHandler = require('../../common/utils/asyncHandler');
const { success } = require('../../common/utils/apiResponse');

const createModuleRouter = ({ name, description }) => {
  const router = express.Router();

  router.get('/', asyncHandler(async (_req, res) => success(res, {
    message: `${name} module is available`,
    data: { module: name, description, implementationStatus: 'scaffolded' },
  })));

  return router;
};

module.exports = createModuleRouter;

