const mongoose = require('mongoose');
require('dotenv').config();

const Event = require('../models/eventModel');

const legacyFieldFilter = { isSummarized: { $exists: true } };

const removeIsSummarized = async ({ apply = false } = {}) => {
  if (!apply) {
    return {
      mode: 'dry-run',
      matchedCount: await Event.collection.countDocuments(legacyFieldFilter),
      modifiedCount: 0,
    };
  }

  const result = await Event.collection.updateMany(legacyFieldFilter, {
    $unset: { isSummarized: '' },
  });

  return {
    mode: 'apply',
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
  };
};

const shouldApply = (args) => {
  const invalidArguments = args.filter((argument) => argument !== '--apply');
  if (invalidArguments.length > 0 || args.filter((argument) => argument === '--apply').length > 1) {
    throw new Error('Usage: npm run migrate:remove-is-summarized -- [--apply]');
  }
  return args.includes('--apply');
};

const run = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI must be configured');
  }

  const apply = shouldApply(process.argv.slice(2));
  await mongoose.connect(process.env.MONGO_URI);

  try {
    const result = await removeIsSummarized({ apply });
    console.log(`[remove-is-summarized] Mode: ${result.mode}`);
    console.log(`[remove-is-summarized] Events containing legacy field: ${result.matchedCount}`);
    console.log(`[remove-is-summarized] Events modified: ${result.modifiedCount}`);
    if (!apply) {
      console.log('[remove-is-summarized] Dry run only; rerun with --apply to remove the field');
    }
  } finally {
    await mongoose.disconnect();
  }
};

if (require.main === module) {
  run().catch((error) => {
    console.error(`[remove-is-summarized] FAIL (${error.name})`);
    process.exitCode = 1;
  });
}

module.exports = removeIsSummarized;
