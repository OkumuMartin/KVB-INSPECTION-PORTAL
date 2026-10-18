const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType, WidthType } = require('docx');
const XLSX = require('xlsx');
const { FINDING_SECTIONS, FINDING_STATUS_LABELS, FINDING_STATUS_GLYPHS, PRODUCT_GROUPS } = require('../config/inspectionFormConfig');
const { getByPath } = require('./inspectionService');

const KVB_GREEN = '#0f6b3e';
const KVB_DARK_GREEN = '#0b4d32';
const KVB_GOLD = '#c9a44c';
const KVB_NAVY = '#102a43';

const STATUS_LABELS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  PENDING_DIRECTOR_REVIEW: 'SUBMITTED - AWAITING REVIEW',
  DIRECTOR_APPROVED: 'SUBMITTED - DIRECTOR APPROVED',
  PENDING_CEO_REVIEW: 'SUBMITTED - AWAITING FINAL APPROVAL',
  RETURNED_TO_INSPECTOR: 'SUBMITTED - RETURNED FOR CORRECTION',
  FINAL_APPROVED: 'FINAL',
};

const CHECKED = '\u2611';
const UNCHECKED = '\u2610';

function flattenInspection(inspection) {
  const form = inspection.formData || {};
  const outletInfo = form.outletInformation || {};
  const owner = form.ownerInformation || {};
  const signOff = form.signOff || {};
  const outletRecord = (inspection.outlet && typeof inspection.outlet === 'object' && inspection.outlet.outletName) ? inspection.outlet : {};
  const typeLabels = { AGROVET: 'Agrovet', CHEMIST: 'Chemist', OTHER: 'Others' };

  const outletTypeValue = outletInfo.outletType || outletRecord.outletType
    ? `${typeLabels[outletInfo.outletType || outletRecord.outletType] || ''}${outletInfo.otherType ? ` - ${outletInfo.otherType}` : ''}`
    : '';

  const rows = [
    ['Field', 'Value'],
    ['Inspection Number', inspection.inspectionNumber || ''],
    ['Date', inspection.inspectionDate ? new Date(inspection.inspectionDate).toLocaleDateString() : ''],
    ['Status', STATUS_LABELS[inspection.status] || inspection.status],
    ['Outlet Name', outletInfo.outletName || outletRecord.outletName || ''],
    ['Outlet Type', outletTypeValue],
    ['County', outletInfo.county || outletRecord.county || ''],
    ['Sub-County', outletInfo.subCounty || outletRecord.subCounty || ''],
    ['Centre', outletInfo.centre || outletRecord.centre || ''],
    ['Owner Name', owner.ownerName || outletRecord.ownerName || ''],
    ['Address', owner.address || outletRecord.address || ''],
    ['Telephone', owner.telephone || outletRecord.ownerPhone || ''],
    ['Training Level', owner.trainingLevel || ''],
    ['KVB Reg No', (form.kvbStatus && form.kvbStatus.registrationNumber) || ''],
    ['Retention', (form.kvbStatus && form.kvbStatus.retention) ? 'Yes' : 'No'],
    ['Practice', (form.kvbStatus && form.kvbStatus.practice) ? 'Yes' : 'No'],
    ['Other Comments', form.otherComments || ''],
  ];

  (form.attendants || []).forEach((att, i) => {
    const s = att.kvbStatus || {};
    rows.push([`Attendant ${i + 1} Name`, att.name || '']);
    rows.push([`Attendant ${i + 1} Tel`, att.telephone || '']);
    rows.push([`Attendant ${i + 1} Reg No`, s.registrationNumber || '']);
    rows.push([`Attendant ${i + 1} Retention`, s.retention ? 'Yes' : 'No']);
    rows.push([`Attendant ${i + 1} Practice`, s.practice ? 'Yes' : 'No']);
  });

  for (const group of PRODUCT_GROUPS) {
    const gv = (form.products && form.products[group.key]) || {};
    for (const item of group.items) {
      rows.push([`${group.title} - ${item.label}`, gv[item.key] ? CHECKED : UNCHECKED]);
    }
  }

  for (const section of FINDING_SECTIONS) {
    for (const item of section.items) {
      const f = getByPath(form.findings, `${section.key}.${item.key}`) || {};
      rows.push([`${section.title} - ${item.label}`, FINDING_STATUS_LABELS[f.status] || f.status || 'NOT_ASSESSED']);
      if (f.remarks) rows.push([`  Remarks: ${item.label}`, f.remarks]);
    }
  }

  if (signOff.inspector) {
    rows.push(['Inspector Name', signOff.inspector.name || '']);
    rows.push(['Inspector Signature', signOff.inspector.signatureData ? 'Signed' : 'Pending']);
    rows.push(['Inspector Date', signOff.inspector.date ? new Date(signOff.inspector.date).toLocaleDateString() : '']);
  }
  if (signOff.personInCharge) {
    rows.push(['Person In Charge Name', signOff.personInCharge.name || '']);
    rows.push(['Person In Charge Signature', signOff.personInCharge.signatureData ? 'Signed' : 'Pending']);
    rows.push(['Person In Charge Date', signOff.personInCharge.date ? new Date(signOff.personInCharge.date).toLocaleDateString() : '']);
  }

  return rows;
}

function buildWordBuffer(inspection) {
  const rows = flattenInspection(inspection);
  const children = [];

  children.push(new Paragraph({ text: 'KENYA VETERINARY BOARD', style: 'Heading1', alignment: AlignmentType.CENTER }));
  children.push(new Paragraph({ text: 'Veterinary Inspection Report', alignment: AlignmentType.CENTER }));
  children.push(new Paragraph({ text: `No: ${inspection.inspectionNumber}`, alignment: AlignmentType.CENTER }));
  children.push(new Paragraph({ text: '' }));

  const tableRows = rows.map((row, ri) => new TableRow({
    children: row.map((cell) => new TableCell({
      children: [new Paragraph({ text: String(cell), bold: ri === 0 })],
      width: { size: 50, type: WidthType.PERCENTAGE },
    })),
  }));

  children.push(new Table({ rows: tableRows }));

  return new Document({ styles: { paragraphStyles: [{ id: 'Heading1', name: 'Heading1', run: { bold: true, size: 28, color: KVB_DARK_GREEN } }] }, sections: [{ children }] }).then((doc) => Packer.toBuffer(doc));
}

function buildExcelBuffer(inspection) {
  const rows = flattenInspection(inspection);
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Inspection');
  return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
}

module.exports = { buildWordBuffer, buildExcelBuffer, flattenInspection };