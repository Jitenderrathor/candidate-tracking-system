const ImportHistory = require('./importHistory.model');
const asyncHandler = require('../../common/utils/asyncHandler');

exports.listImportHistory = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const skip = (page - 1) * limit;

  const total = await ImportHistory.countDocuments();
  const history = await ImportHistory.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('importedBy', 'name email')
    .lean();

  res.status(200).json({
    status: 'success',
    data: {
      history,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
});
