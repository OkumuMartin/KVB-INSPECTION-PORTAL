const { Inspection, Outlet, User, InspectionComment } = require('../models');
const { createAuditLog, listInspectionAuditLogs } = require('../services/auditLogService');
const { generateInspectionNumber } = require('../services/inspectionNumberService');
const { sendEmail, buildInternalEmail } = require('../services/emailService');
const { generatePdfBuffer } = require('../services/pdfService');
const { buildWordBuffer, buildExcelBuffer } = require('../services/exportService');
const { validateTransition } = require('../services/workflowService');
const {
  buildFormDataFromOutlet,
  canAccessInspection,
  computeComplianceSummary,
  deepMerge,
  diffFormData,
  isEditable,
  normalizeFormData,
  validateForSubmission,
} = require('../services/inspectionService');
const { transitionStatus } = require('../services/workflowService');

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sanitizeInspection(inspection) {
  if (!inspection) return null;
  const obj = inspection.toObject ? inspection.toObject() : { ...inspection };
  if (obj.signature && obj.signature.data) obj.signature.data = '[withheld]';
  if (obj.finalApproval && obj.finalApproval.signature && obj.finalApproval.signature.data) {
    obj.finalApproval.signature.data = '[withheld]';
  }
  if (obj.formData && obj.formData.signOff) {
    obj.formData.signOff.inspector = stripSignatureData(obj.formData.signOff.inspector);
    obj.formData.signOff.personInCharge = stripSignatureData(obj.formData.signOff.personInCharge);
  }
  return obj;
}

function stripSignatureData(signatory) {
  if (!signatory) return signatory;
  return { ...signatory, hasSignature: Boolean(signatory.signatureData), signatureData: undefined };
}

function getOutletName(inspection) {
  const formOutlet = (inspection.formData || {}).outletInformation || {};
  if (formOutlet.outletName) return formOutlet.outletName;
  if (inspection.outlet && inspection.outlet.outletName) return inspection.outlet.outletName;
  return 'N/A';
}

async function loadAccessibleInspection(req, res) {
  const inspection = await Inspection.findById(req.params.id);
  if (!inspection) {
    res.status(404).json({ success: false, message: 'Inspection not found.' });
    return null;
  }
  if (!canAccessInspection(inspection, req.user)) {
    res.status(403).json({ success: false, message: 'You do not have permission to access this inspection.' });
    return null;
  }
  return inspection;
}

async function listInspections(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 25, 1), 100);
    const { search, status, county, subCounty, outletType, dateFrom, dateTo } = req.query;

    const filter = {};

    if (search) {
      const pattern = new RegExp(escapeRegExp(search), 'i');
      filter.$or = [
        { inspectionNumber: pattern },
        { 'formData.outletInformation.outletName': pattern },
        { 'formData.outletInformation.centre': pattern },
        { 'formData.ownerInformation.ownerName': pattern },
        { 'formData.kvbStatus.registrationNumber': pattern },
        { 'formData.attendants.kvbStatus.registrationNumber': pattern },
        { 'formData.attendants.name': pattern },
      ];
    }

    if (status) filter.status = status;
    if (county) filter['formData.outletInformation.county'] = county;
    if (subCounty) filter['formData.outletInformation.subCounty'] = subCounty;
    if (outletType) filter['formData.outletInformation.outletType'] = outletType;

    if (dateFrom || dateTo) {
      filter.inspectionDate = {};
      if (dateFrom) filter.inspectionDate.$gte = new Date(`${dateFrom}T00:00:00.000Z`);
      if (dateTo) filter.inspectionDate.$lte = new Date(`${dateTo}T23:59:59.999Z`);
    }

    if (req.user.role === 'INSPECTOR') {
      filter.inspector = req.user._id;
    } else if (req.user.role === 'DIRECTOR') {
      filter.status = filter.status || { $in: ['SUBMITTED', 'PENDING_DIRECTOR_REVIEW', 'DIRECTOR_APPROVED', 'RETURNED_TO_INSPECTOR', 'FINAL_APPROVED'] };
    } else if (req.user.role === 'CEO_REGISTRAR') {
      filter.status = filter.status || { $in: ['DIRECTOR_APPROVED', 'PENDING_CEO_REVIEW', 'RETURNED_TO_INSPECTOR', 'FINAL_APPROVED'] };
    }

    const skip = (page - 1) * limit;

    const [inspections, total] = await Promise.all([
      Inspection.find(filter)
        .populate('outlet', 'outletName county subCounty')
        .populate('inspector', 'name role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Inspection.countDocuments(filter),
    ]);

    const items = inspections.map((item) => {
      const sanitized = sanitizeInspection(item);
      sanitized.compliance = computeComplianceSummary(item.formData);
      return sanitized;
    });

    return res.json({ success: true, items, total, page, limit, pages: Math.ceil(total / limit) || 1 });
  } catch (error) {
    return next(error);
  }
}

async function getInspection(req, res, next) {
  try {
    const inspection = await Inspection.findById(req.params.id)
      .populate('outlet')
      .populate('inspector', 'name role designation')
      .lean();

    if (!inspection) {
      return res.status(404).json({ success: false, message: 'Inspection not found.' });
    }

    if (!canAccessInspection(inspection, req.user)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to view this inspection.' });
    }

    const comments = await InspectionComment.find({ inspection: inspection._id })
      .populate('author', 'name role')
      .sort({ createdAt: 1 })
      .lean();

    return res.json({
      success: true,
      item: sanitizeInspection(inspection),
      comments,
      compliance: computeComplianceSummary(inspection.formData),
      editable: isEditable(inspection),
    });
  } catch (error) {
    return next(error);
  }
}

async function createInspection(req, res, next) {
  try {
    const { outlet: outletId, inspectionDate, formData } = req.body;

    const outlet = await Outlet.findById(outletId).lean();
    if (!outlet) {
      return res.status(404).json({ success: false, message: 'Outlet not found.' });
    }

    const inspectionNumber = await generateInspectionNumber();
    const resolvedDate = inspectionDate ? new Date(`${inspectionDate}T00:00:00.000Z`) : new Date();

    const initialFormData = formData
      ? normalizeFormData(formData)
      : buildFormDataFromOutlet(outlet, {
          inspectionNumber,
          inspectionDate: resolvedDate,
          inspectorName: req.user.name,
        });

    const inspection = await Inspection.create({
      inspectionNumber,
      outlet: outlet._id,
      inspector: req.user._id,
      inspectionDate: resolvedDate,
      status: 'DRAFT',
      draft: true,
      formData: initialFormData,
      workflowHistory: [
        {
          action: 'INSPECTION_CREATED',
          actor: req.user._id,
          role: req.user.role,
          timestamp: new Date(),
        },
      ],
    });

    await createAuditLog({
      req,
      user: req.user._id,
      role: req.user.role,
      action: 'INSPECTION_CREATED',
      inspection: inspection._id,
      metadata: { status: 'DRAFT', inspectionNumber },
    });

    return res.status(201).json({
      success: true,
      message: 'Inspection created successfully.',
      data: { id: inspection._id, inspectionNumber, status: inspection.status },
      item: sanitizeInspection(inspection),
    });
  } catch (error) {
    return next(error);
  }
}

async function updateInspection(req, res, next) {
  try {
    const inspection = await Inspection.findById(req.params.id);
    if (!inspection) {
      return res.status(404).json({ success: false, message: 'Inspection not found.' });
    }

    const isOwner = inspection.inspector.toString() === req.user._id.toString();
    if (req.user.role === 'INSPECTOR' && !isOwner) {
      return res.status(403).json({ success: false, message: 'You do not have permission to edit this inspection.' });
    }
    if (req.user.role !== 'INSPECTOR' && req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ success: false, message: 'Only the responsible inspector may edit this inspection.' });
    }

    if (!isEditable(inspection)) {
      return res.status(409).json({
        success: false,
        message: 'This inspection is no longer editable.',
        errors: [{ field: 'status', message: `Inspections in status ${inspection.status} cannot be modified.` }],
      });
    }

    const before = inspection.formData ? inspection.formData.toObject() : {};

    if (req.body.outlet) {
      const outlet = await Outlet.findById(req.body.outlet).lean();
      if (!outlet) {
        return res.status(404).json({ success: false, message: 'Outlet not found.' });
      }
      inspection.outlet = outlet._id;
    }

    if (req.body.inspectionDate) {
      inspection.inspectionDate = new Date(`${req.body.inspectionDate}T00:00:00.000Z`);
    }

    if (req.body.formData) {
      inspection.formData = normalizeFormData(deepMerge(before, req.body.formData));
    }

    await inspection.save();

    const changes = diffFormData(before, inspection.formData.toObject());

    await createAuditLog({
      req,
      user: req.user._id,
      role: req.user.role,
      action: inspection.status === 'DRAFT' ? 'DRAFT_SAVED' : 'INSPECTION_UPDATED',
      inspection: inspection._id,
      metadata: { status: inspection.status },
      changes,
    });

    return res.json({
      success: true,
      message: 'Inspection saved successfully.',
      item: sanitizeInspection(inspection),
      changedFields: Object.keys(changes),
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteInspection(req, res, next) {
  try {
    const inspection = await Inspection.findById(req.params.id);
    if (!inspection) {
      return res.status(404).json({ success: false, message: 'Inspection not found.' });
    }

    const isOwner = inspection.inspector.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ success: false, message: 'You do not have permission to delete this inspection.' });
    }

    if (inspection.status !== 'DRAFT' || inspection.isLocked) {
      return res.status(409).json({
        success: false,
        message: 'Only draft inspections can be deleted. Submitted records are retained for audit purposes.',
      });
    }

    const { inspectionNumber } = inspection;
    await InspectionComment.deleteMany({ inspection: inspection._id });
    await inspection.deleteOne();

    await createAuditLog({
      req,
      user: req.user._id,
      role: req.user.role,
      action: 'INSPECTION_DELETED',
      inspection: req.params.id,
      metadata: { inspectionNumber, status: 'DRAFT' },
    });

    return res.json({ success: true, message: 'Draft inspection deleted.', data: { id: req.params.id } });
  } catch (error) {
    return next(error);
  }
}

async function submitInspection(req, res, next) {
  try {
    const inspection = await Inspection.findById(req.params.id);
    if (!inspection) {
      return res.status(404).json({ success: false, message: 'Inspection not found.' });
    }

    if (inspection.inspector.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only submit your own inspections.' });
    }

    if (inspection.isLocked || inspection.status === 'FINAL_APPROVED') {
      return res.status(409).json({ success: false, message: 'This inspection is locked and cannot be submitted.' });
    }

    if (!validateTransition(inspection.status, 'SUBMITTED')) {
      return res.status(409).json({
        success: false,
        message: `An inspection in status ${inspection.status} cannot be submitted.`,
      });
    }

    const errors = validateForSubmission(inspection);
    if (errors.length > 0) {
      return res.status(422).json({
        success: false,
        message: 'This inspection is not ready for submission.',
        errors,
      });
    }

    const action = inspection.status === 'RETURNED_TO_INSPECTOR' ? 'INSPECTION_RESUBMITTED' : 'INSPECTION_SUBMITTED';
    const previousStatus = inspection.status;

    // Single save — transition directly to PENDING_DIRECTOR_REVIEW
    inspection.draft = false;
    inspection.status = 'PENDING_DIRECTOR_REVIEW';
    inspection.workflowHistory.push({
      action,
      actor: req.user._id,
      role: req.user.role,
      timestamp: new Date(),
      metadata: { from: previousStatus, to: 'PENDING_DIRECTOR_REVIEW' },
    });
    await inspection.save();

    await createAuditLog({
      req,
      user: req.user._id,
      role: req.user.role,
      action,
      inspection: inspection._id,
      metadata: { from: previousStatus, to: 'PENDING_DIRECTOR_REVIEW', inspectionNumber: inspection.inspectionNumber },
    });

    const director = await User.findOne({ role: 'DIRECTOR', status: 'ACTIVE' }).lean();
    if (director) {
      const { html, text } = buildInternalEmail({
        inspectionNumber: inspection.inspectionNumber,
        outletName: getOutletName(inspection),
        status: 'SUBMITTED',
        reviewerName: director.name,
        role: 'Director',
      });

      await sendEmail({
        to: director.email,
        emailType: 'INSPECTION_SUBMITTED',
        subject: `KVB Inspection ${inspection.inspectionNumber} - Awaiting Your Review`,
        html,
        text,
        inspection: inspection._id,
        sender: req.user,
      });
    }

    return res.json({
      success: true,
      message: 'Inspection submitted for director review.',
      data: { inspectionNumber: inspection.inspectionNumber, status: inspection.status },
      item: sanitizeInspection(inspection),
    });
  } catch (error) {
    return next(error);
  }
}

async function returnInspection(req, res, next) {
  try {
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'A reason is required to return an inspection.' });
    }

    const inspection = await Inspection.findById(req.params.id);
    if (!inspection) {
      return res.status(404).json({ success: false, message: 'Inspection not found.' });
    }

    if (req.user.role === 'DIRECTOR') {
      if (inspection.status !== 'PENDING_DIRECTOR_REVIEW' && inspection.status !== 'SUBMITTED') {
        return res.status(400).json({ success: false, message: 'This inspection is not awaiting your review.' });
      }
    } else if (req.user.role === 'CEO_REGISTRAR') {
      if (inspection.status !== 'PENDING_CEO_REVIEW') {
        return res.status(400).json({ success: false, message: 'This inspection is not awaiting final review.' });
      }
    } else {
      return res.status(403).json({ success: false, message: 'Only the Director or CEO/Registrar can return inspections.' });
    }

    if (!validateTransition(inspection.status, 'RETURNED_TO_INSPECTOR')) {
      return res.status(409).json({ success: false, message: 'This inspection cannot be returned at its current status.' });
    }

    // Use centralized state machine so the transition is audit-tracked consistently
    await transitionStatus(inspection._id, 'RETURNED_TO_INSPECTOR', req.user, reason, { req });

    const updated = await Inspection.findById(inspection._id)
      .populate('inspector', 'name email role')
      .lean();

    const inspectorUser = updated.inspector;
    if (inspectorUser) {
      try {
        const { html, text } = buildInternalEmail({
          inspectionNumber: updated.inspectionNumber,
          outletName: getOutletName(updated),
          status: 'RETURNED_TO_INSPECTOR',
          reviewerName: inspectorUser.name,
          role: req.user.role,
          comments: reason,
        });
        await sendEmail({
          to: inspectorUser.email,
          emailType: 'INSPECTION_RETURNED',
          subject: `KVB Inspection ${updated.inspectionNumber} - Returned for Correction`,
          html,
          text,
          inspection: updated._id,
          sender: req.user,
        });
      } catch (emailError) {
        console.error(`Failed to send return email for ${updated.inspectionNumber}:`, emailError.message);
      }
    }

    return res.json({ success: true, message: 'Inspection returned to inspector.', item: sanitizeInspection(updated) });
  } catch (error) {
    return next(error);
  }
}

async function revertInspection(req, res, next) {
  try {
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'A reason is required to revert an inspection to the Director.' });
    }

    const inspection = await Inspection.findById(req.params.id);
    if (!inspection) {
      return res.status(404).json({ success: false, message: 'Inspection not found.' });
    }

    if (inspection.status !== 'PENDING_CEO_REVIEW') {
      return res.status(400).json({ success: false, message: 'This inspection is not awaiting CEO/Registrar review.' });
    }

    if (!validateTransition(inspection.status, 'PENDING_DIRECTOR_REVIEW')) {
      return res.status(409).json({ success: false, message: 'This inspection cannot be reverted at its current status.' });
    }

    await transitionStatus(inspection._id, 'PENDING_DIRECTOR_REVIEW', req.user, reason.trim(), { req });

    const updated = await Inspection.findById(inspection._id)
      .populate('inspector', 'name email role')
      .lean();

    const inspectorUser = updated.inspector;
    if (inspectorUser) {
      try {
        const { html, text } = buildInternalEmail({
          inspectionNumber: updated.inspectionNumber,
          outletName: getOutletName(updated),
          status: 'REVERTED_TO_DIRECTOR',
          reviewerName: inspectorUser.name,
          role: req.user.role,
          comments: reason.trim(),
        });

        await sendEmail({
          to: inspectorUser.email,
          emailType: 'INSPECTION_REVERTED',
          subject: `KVB Inspection ${updated.inspectionNumber} - Reverted to Director for Review`,
          html,
          text,
          inspection: updated._id,
          sender: req.user,
        });
      } catch (emailError) {
        console.error(`Failed to send revert email for ${updated.inspectionNumber}:`, emailError.message);
      }
    }

    return res.json({ success: true, message: 'Inspection reverted to Director for review.', item: sanitizeInspection(updated) });
  } catch (error) {
    return next(error);
  }
}

async function directorApprove(req, res, next) {
  try {
    const inspection = await Inspection.findById(req.params.id);
    if (!inspection) {
      return res.status(404).json({ success: false, message: 'Inspection not found.' });
    }

    if (inspection.status !== 'PENDING_DIRECTOR_REVIEW') {
      return res.status(400).json({ success: false, message: 'This inspection is not awaiting director review.' });
    }

    // Use centralized state machine so the transition is audit-tracked consistently.
    // Both transitions are applied in a single document save to avoid two DB writes.
    const previousStatus = inspection.status;
    inspection.status = 'PENDING_CEO_REVIEW';
    inspection.isLocked = false;
    inspection.draft = false;
    inspection.workflowHistory = inspection.workflowHistory || [];
    inspection.workflowHistory.push({
      action: 'DIRECTOR_APPROVED',
      actor: req.user._id,
      role: req.user.role,
      reason: null,
      timestamp: new Date(),
      metadata: { from: previousStatus, to: 'DIRECTOR_APPROVED' },
    });
    inspection.workflowHistory.push({
      action: 'STATUS_CHANGED_TO_PENDING_CEO_REVIEW',
      actor: req.user._id,
      role: req.user.role,
      reason: null,
      timestamp: new Date(),
      metadata: { from: 'DIRECTOR_APPROVED', to: 'PENDING_CEO_REVIEW' },
    });

    // Extract request metadata safely — req may contain circular refs.
    const ipAddress = req.headers?.['x-forwarded-for']?.split(',')[0]?.trim()
      || req.ip
      || undefined;
    const userAgent = req.headers?.['user-agent'] || undefined;

    const safeMeta = { ipAddress, userAgent };
    try {
      await inspection.save();
    } catch (saveError) {
      const error = new Error(`Failed to persist inspection status change: ${saveError.message}`);
      error.statusCode = 500;
      throw error;
    }

    // Audit log — fail-open
    try {
      await createAuditLog({
        ipAddress,
        userAgent,
        user: req.user._id,
        role: req.user.role,
        action: 'DIRECTOR_APPROVED',
        inspection: inspection._id,
        metadata: { from: previousStatus, to: 'PENDING_CEO_REVIEW', via: 'DIRECTOR_APPROVED', ...safeMeta },
      });
    } catch (auditError) {
      console.error('Audit log creation failed:', auditError.message);
    }

    const updated = await Inspection.findById(inspection._id)
      .populate('inspector', 'name email role')
      .lean();

    const ceo = await User.findOne({ role: 'CEO_REGISTRAR', status: 'ACTIVE' }).lean();
    if (ceo) {
      const { html, text } = buildInternalEmail({
        inspectionNumber: updated.inspectionNumber,
        outletName: getOutletName(updated),
        status: 'DIRECTOR_APPROVED',
        reviewerName: ceo.name,
        role: 'CEO/Registrar',
      });

      try {
        await sendEmail({
          to: ceo.email,
          emailType: 'DIRECTOR_APPROVED',
          subject: `KVB Inspection ${updated.inspectionNumber} - Awaiting Final Approval`,
          html,
          text,
          inspection: updated._id,
          sender: req.user,
        });
      } catch (emailError) {
        console.error(`Failed to send director-approve email for ${updated.inspectionNumber}:`, emailError.message);
      }
    }

    return res.json({ success: true, message: 'Inspection approved by director.', item: sanitizeInspection(updated) });
  } catch (error) {
    return next(error);
  }
}

async function finalApprove(req, res, next) {
  try {
    const inspection = await Inspection.findById(req.params.id)
      .populate('outlet')
      .populate('inspector', 'name email role')
      .lean();
    if (!inspection) {
      return res.status(404).json({ success: false, message: 'Inspection not found.' });
    }

    if (inspection.status !== 'DIRECTOR_APPROVED' && inspection.status !== 'PENDING_CEO_REVIEW') {
      return res.status(400).json({ success: false, message: 'This inspection is not eligible for final approval.' });
    }

    if (inspection.isLocked) {
      return res.status(400).json({ success: false, message: 'This inspection is already final approved and locked.' });
    }

    // Use centralized state machine so the transition is audit-tracked consistently
    await transitionStatus(inspection._id, 'FINAL_APPROVED', req.user, null, { req });

    const updated = await Inspection.findById(inspection._id)
      .populate('outlet')
      .populate('inspector', 'name email role')
      .lean();

    if (req.body.signature) {
      const signature = {
        name: req.body.signature.name || req.user.name,
        role: req.user.role,
        capturedAt: req.body.signature.capturedAt ? new Date(req.body.signature.capturedAt) : new Date(),
        data: typeof req.body.signature.data === 'string' ? req.body.signature.data : undefined,
      };
      await Inspection.findByIdAndUpdate(inspection._id, { $set: { 'finalApproval.signature': signature } });
      const refreshed = await Inspection.findById(inspection._id)
        .populate('outlet')
        .populate('inspector', 'name email role')
        .lean();
      Object.assign(updated, refreshed);
    }

    // Generate the official PDF certificate
    let pdfBuffer;
    try {
      pdfBuffer = await generatePdfBuffer(updated);
    } catch (pdfError) {
      // PDF generation failure should not block the approval itself, but must be logged
      console.error(`PDF generation failed for ${updated.inspectionNumber}:`, pdfError);
    }

    // Notify the outlet owner of the final approval
    const outlet = updated.outlet || {};
    const ownerEmail = (updated.formData && updated.formData.ownerInformation && updated.formData.ownerInformation.ownerEmail)
      || outlet.ownerEmail;
    if (ownerEmail) {
      const { html, text } = buildInternalEmail({
        inspectionNumber: updated.inspectionNumber,
        outletName: getOutletName(updated),
        status: 'FINAL_APPROVED',
        reviewerName: req.user.name,
        role: 'CEO/Registrar',
      });

      try {
        await sendEmail({
          to: ownerEmail,
          emailType: 'INSPECTION_FINAL_APPROVED',
          subject: `KVB Inspection ${updated.inspectionNumber} - Final Approval Certificate`,
          html,
          text,
          inspection: updated._id,
          sender: req.user,
        });
      } catch (emailError) {
        console.error(`Failed to send final-approve email for ${updated.inspectionNumber}:`, emailError.message);
      }
    }

    return res.json({
      success: true,
      message: 'Final approval recorded. This inspection is now locked and read-only.',
      item: sanitizeInspection(updated),
    });
  } catch (error) {
    return next(error);
  }
}

async function generatePdf(req, res, next) {
  try {
    const inspection = await Inspection.findById(req.params.id)
      .populate('outlet')
      .populate('inspector', 'name role designation')
      .lean();

    if (!inspection) {
      return res.status(404).json({ success: false, message: 'Inspection not found.' });
    }

    if (!canAccessInspection(inspection, req.user)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to generate this PDF.' });
    }

    const pdfBuffer = await generatePdfBuffer(inspection);

    await createAuditLog({
      req,
      user: req.user._id,
      role: req.user.role,
      action: 'PDF_GENERATED',
      inspection: inspection._id,
      metadata: { status: inspection.status },
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdfBuffer.length,
      'Content-Disposition': `inline; filename="${inspection.inspectionNumber}.pdf"`,
    });

    return res.send(pdfBuffer);
  } catch (error) {
    return next(error);
  }
}

async function getInspectionAuditLog(req, res, next) {
  try {
    const inspection = await Inspection.findById(req.params.id).select('inspector status').lean();
    if (!inspection) {
      return res.status(404).json({ success: false, message: 'Inspection not found.' });
    }

    if (!canAccessInspection(inspection, req.user)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to view this audit trail.' });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
    const { items, total } = await listInspectionAuditLogs(req.params.id, { page, limit });

    return res.json({ success: true, items, total, page, limit });
  } catch (error) {
    return next(error);
  }
}

async function listComments(req, res, next) {
  try {
    const inspection = await Inspection.findById(req.params.id).select('inspector status').lean();
    if (!inspection) {
      return res.status(404).json({ success: false, message: 'Inspection not found.' });
    }
    if (!canAccessInspection(inspection, req.user)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to view this inspection.' });
    }

    const comments = await InspectionComment.find({ inspection: req.params.id })
      .populate('author', 'name role')
      .sort({ createdAt: 1 })
      .lean();

    return res.json({ success: true, items: comments });
  } catch (error) {
    return next(error);
  }
}

async function addComment(req, res, next) {
  try {
    const { commentText, isInternal } = req.body;

    if (!commentText || !commentText.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text is required.' });
    }

    const inspection = await Inspection.findById(req.params.id).select('inspector status').lean();
    if (!inspection) {
      return res.status(404).json({ success: false, message: 'Inspection not found.' });
    }
    if (!canAccessInspection(inspection, req.user)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to comment on this inspection.' });
    }

    const comment = await InspectionComment.create({
      inspection: req.params.id,
      author: req.user._id,
      role: req.user.role,
      commentText: commentText.trim(),
      isInternal: Boolean(isInternal),
    });

    await createAuditLog({
      req,
      user: req.user._id,
      role: req.user.role,
      action: 'COMMENT_ADDED',
      inspection: req.params.id,
      metadata: { isInternal: Boolean(isInternal) },
    });

    return res.status(201).json({ success: true, item: comment });
  } catch (error) {
    return next(error);
  }
}

async function exportInspection(req, res, next) {
  try {
    const format = req.query.format || 'pdf';
    const inspection = await Inspection.findById(req.params.id)
      .populate('outlet')
      .populate('inspector', 'name role designation')
      .lean();

    if (!inspection) {
      return res.status(404).json({ success: false, message: 'Inspection not found.' });
    }
    if (!canAccessInspection(inspection, req.user)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to export this inspection.' });
    }

    let buffer;
    let contentType;
    let extension;

    if (format === 'word') {
      buffer = await buildWordBuffer(inspection);
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      extension = 'docx';
    } else if (format === 'excel') {
      buffer = buildExcelBuffer(inspection);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      extension = 'xlsx';
    } else {
      buffer = await generatePdfBuffer(inspection);
      contentType = 'application/pdf';
      extension = 'pdf';
    }

    await createAuditLog({
      req,
      user: req.user._id,
      role: req.user.role,
      action: 'EXPORT_GENERATED',
      inspection: inspection._id,
      metadata: { format },
    });

    res.set({
      'Content-Type': contentType,
      'Content-Length': buffer.length,
      'Content-Disposition': `attachment; filename="${inspection.inspectionNumber}.${extension}"`,
    });
    return res.send(buffer);
  } catch (error) {
    return next(error);
  }
}

async function exportReports(req, res, next) {
  try {
    const format = req.query.format || 'pdf';
    const ids = (req.query.ids || '').split(',').filter(Boolean);
    if (ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No inspection IDs provided.' });
    }

    const inspections = await Inspection.find({ _id: { $in: ids } })
      .populate('outlet')
      .populate('inspector', 'name role designation')
      .lean();

    if (format === 'excel') {
      const XLSX = require('xlsx');
      const allRows = [['Inspection Number', 'Date', 'Status', 'Outlet Name', 'County', 'Owner Name', 'Telephone']];
      for (const ins of inspections) {
        const form = ins.formData || {};
        const oi = form.outletInformation || {};
        allRows.push([
          ins.inspectionNumber,
          ins.inspectionDate ? new Date(ins.inspectionDate).toLocaleDateString() : '',
          ins.status,
          oi.outletName || ins.outlet?.outletName || '',
          oi.county || ins.outlet?.county || '',
          (form.ownerInformation && form.ownerInformation.ownerName) || ins.outlet?.ownerName || '',
          (form.ownerInformation && form.ownerInformation.telephone) || ins.outlet?.ownerPhone || '',
        ]);
      }
      const ws = XLSX.utils.aoa_to_sheet(allRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Reports');
      const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Length': buffer.length,
        'Content-Disposition': 'attachment; filename="kvb-reports.xlsx"',
      });
      return res.send(buffer);
    }

    // Default: PDF via simple concatenation not supported; return JSON hint
    return res.status(400).json({ success: false, message: `Format '${format}' not supported for bulk export. Use Excel.` });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listInspections,
  getInspection,
  createInspection,
  updateInspection,
  deleteInspection,
  submitInspection,
  returnInspection,
  revertInspection,
  directorApprove,
  finalApprove,
  generatePdf,
  exportInspection,
  exportReports,
  getInspectionAuditLog,
  listComments,
  addComment,
  sanitizeInspection,
  escapeRegExp,
};
