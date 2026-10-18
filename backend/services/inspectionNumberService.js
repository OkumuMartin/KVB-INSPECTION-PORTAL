const { Counter } = require('../models');

async function generateInspectionNumber() {
  const year = new Date().getFullYear();
  const idPattern = `inspectionNumber:${year}`;

  // Atomic increment — no race condition.
  // A unique index on Inspection.inspectionNumber catches any residual collision
  // at the controller level, where the real document is created.
  const counter = await Counter.findByIdAndUpdate(
    idPattern,
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true },
  );

  const seq = counter.seq;
  return `KVB-INS-${year}-${String(seq).padStart(4, '0')}`;
}

module.exports = { generateInspectionNumber };