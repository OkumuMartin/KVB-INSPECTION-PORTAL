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
  const wb = XLSX.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Inspection');
  return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
}

/**
 * One summary row per inspection. Shared by the bulk spreadsheet and the
 * bulk PDF so both exports describe the same set of fields.
 */
function summariseInspection(inspection) {
  const form = inspection.formData || {};
  const outletInfo = form.outletInformation || {};
  const owner = form.ownerInformation || {};
  const outletRecord = inspection.outlet && typeof inspection.outlet === 'object' ? inspection.outlet : {};
  const inspector = inspection.inspector && typeof inspection.inspector === 'object' ? inspection.inspector : {};

  return {
    inspectionNumber: inspection.inspectionNumber || '',
    date: inspection.inspectionDate ? new Date(inspection.inspectionDate).toLocaleDateString() : '',
    status: STATUS_LABELS[inspection.status] || inspection.status || '',
    outletName: outletInfo.outletName || outletRecord.outletName || '',
    county: outletInfo.county || outletRecord.county || '',
    subCounty: outletInfo.subCounty || outletRecord.subCounty || '',
    ownerName: owner.ownerName || outletRecord.ownerName || '',
    telephone: owner.telephone || outletRecord.ownerPhone || '',
    inspector: inspector.name || '',
  };
}

const SUMMARY_HEADERS = [
  'Inspection Number',
  'Date',
  'Status',
  'Outlet Name',
  'County',
  'Sub-County',
  'Owner Name',
  'Telephone',
  'Inspector',
];

function buildBulkExcelBuffer(inspections) {
  const rows = [SUMMARY_HEADERS];
  for (const inspection of inspections) {
    const row = summariseInspection(inspection);
    rows.push([
      row.inspectionNumber,
      row.date,
      row.status,
      row.outletName,
      row.county,
      row.subCounty,
      row.ownerName,
      row.telephone,
      row.inspector,
    ]);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Reports');
  return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
}

function buildBulkWordBuffer(inspections) {
  const children = [];

  children.push(new Paragraph({ text: 'KENYA VETERINARY BOARD', style: 'Heading1', alignment: AlignmentType.CENTER }));
  children.push(new Paragraph({ text: 'Veterinary Inspection Reports', alignment: AlignmentType.CENTER }));
  children.push(
    new Paragraph({
      text: `${inspections.length} inspection(s) included | generated on ${new Date().toLocaleString()}`,
      alignment: AlignmentType.CENTER,
    }),
  );
  children.push(new Paragraph({ text: '' }));

  // Summary table first, so the document opens with the overview.
  const summaryRows = [
    SUMMARY_HEADERS.map((header) => new TableCell({ children: [new Paragraph({ text: header, bold: true })] })),
    ...inspections.map((inspection) => {
      const row = summariseInspection(inspection);
      return [
        row.inspectionNumber,
        row.date,
        row.status,
        row.outletName,
        row.county,
        row.subCounty,
        row.ownerName,
        row.telephone,
        row.inspector,
      ].map((cell) => new TableCell({ children: [new Paragraph({ text: String(cell) })] }));
    }),
  ];
  children.push(new Table({ rows: summaryRows }));

  // Then the full report for every inspection, each on its own page.
  for (const inspection of inspections) {
    const rows = flattenInspection(inspection);
    children.push(
      new Paragraph({
        text: `Inspection ${inspection.inspectionNumber}`,
        style: 'Heading2',
        pageBreakBefore: true,
      }),
    );
    children.push(
      new Table({
        rows: rows.map((row, ri) => new TableRow({
          children: row.map((cell) => new TableCell({
            children: [new Paragraph({ text: String(cell), bold: ri === 0 })],
            width: { size: 50, type: WidthType.PERCENTAGE },
          })),
        })),
      }),
    );
  }

  return new Document({
    styles: {
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading1', run: { bold: true, size: 28, color: KVB_DARK_GREEN } },
        { id: 'Heading2', name: 'Heading2', run: { bold: true, size: 24, color: KVB_DARK_GREEN } },
      ],
    },
    sections: [{ children }],
  }).then((doc) => Packer.toBuffer(doc));
}

module.exports = {
  buildWordBuffer,
  buildExcelBuffer,
  buildBulkWordBuffer,
  buildBulkExcelBuffer,
  flattenInspection,
  summariseInspection,
  SUMMARY_HEADERS,
};