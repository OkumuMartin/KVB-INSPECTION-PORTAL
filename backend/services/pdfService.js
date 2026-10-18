const PdfPrinter = require('pdfmake');

const PRINTER = new PdfPrinter({
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
});

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

function buildStyles() {
  return {
    pageMargins: [40, 50, 40, 60],
    defaultStyle: { font: 'Helvetica', fontSize: 9, textColor: '#202a2f' },
    docTitle: { fontSize: 12, bold: true, textColor: KVB_NAVY, alignment: 'center' },
    sectionHeader: {
      fontSize: 10,
      bold: true,
      textColor: KVB_DARK_GREEN,
      margin: [0, 12, 0, 4],
      border: [false, true, false, false],
      borderColor: KVB_GREEN,
      borderWidth: [0, 0.5, 0, 0],
    },
    subHeader: { fontSize: 9.5, bold: true, textColor: KVB_NAVY, margin: [0, 8, 0, 3] },
    label: { fontSize: 8, textColor: '#5c6770', bold: true },
    value: { fontSize: 9, textColor: '#202a2f' },
    tableHeader: { fontSize: 8, bold: true, textColor: KVB_NAVY },
  };
}

function buildHeader(inspectionNumber) {
  return {
    columns: [
      {
        width: '*',
        stack: [
          { text: 'KENYA VETERINARY BOARD', style: 'docTitle', fontSize: 15, textColor: KVB_DARK_GREEN },
          { text: 'P.O. Box 513-00605, Nairobi - Kenya | Mobile: 0722305253', style: 'label', alignment: 'center' },
          { text: 'info@kenyavetboard.or.ke | www.kenyavetboard.or.ke', style: 'label', alignment: 'center', margin: [0, 1, 0, 0] },
        ],
      },
      {
        width: 'auto',
        stack: [
          { text: 'VETERINARY INSPECTORATE SERVICES', style: 'label', alignment: 'right', textColor: KVB_GREEN },
          { text: `No: ${inspectionNumber}`, style: 'label', alignment: 'right', margin: [0, 2, 0, 0] },
        ],
      },
    ],
    margin: [0, 0, 0, 10],
  };
}

function buildInfoSection(fields) {
  const rows = [];

  for (let i = 0; i < fields.length; i += 2) {
    const row = [];

    for (let j = 0; j < 2; j += 1) {
      const field = fields[i + j];

      if (!field) {
        row.push({ width: '50%', text: '' });
        continue;
      }

      row.push({
        width: '50%',
        stack: [
          { text: field.label, style: 'label' },
          { text: field.value ? String(field.value) : '............................................', style: 'value' },
        ],
        margin: [0, 0, j === 1 ? 0 : 10, 0],
      });
    }

    rows.push(row);
  }

  return {
    table: { widths: ['50%', '50%'], body: rows },
    layout: 'noBorders',
    margin: [0, 0, 0, 4],
  };
}

function kvbStatusFields(kvbStatus) {
  const status = kvbStatus || {};
  return [
    { label: 'Reg. No.', value: status.registrationNumber },
    { label: 'Retention', value: status.retention ? 'Yes' : 'No' },
    { label: 'Practice', value: status.practice ? 'Yes' : 'No' },
  ];
}

function buildAttendantTable(attendants) {
  if (!attendants || attendants.length === 0) {
    return { text: 'No attendant information recorded.', style: 'value', margin: [0, 0, 0, 4] };
  }

  const body = [
    [
      { text: '#', style: 'tableHeader' },
      { text: 'Name', style: 'tableHeader' },
      { text: 'Tel. No.', style: 'tableHeader' },
      { text: 'Reg. No.', style: 'tableHeader' },
      { text: 'Retention', style: 'tableHeader' },
      { text: 'Practice', style: 'tableHeader' },
    ],
    ...attendants.map((attendant, index) => {
      const status = attendant.kvbStatus || {};
      return [
        String(index + 1),
        attendant.name || '',
        attendant.telephone || '',
        status.registrationNumber || '',
        status.retention ? 'Yes' : 'No',
        status.practice ? 'Yes' : 'No',
      ];
    }),
  ];

  return {
    table: { headerRows: 1, widths: ['5%', '30%', '20%', '20%', '12%', '13%'], body },
    layout: 'lightHorizontalLines',
    margin: [0, 2, 0, 4],
  };
}

function buildProductsSection(products) {
  const form = products || {};
  const content = [];

  for (const group of PRODUCT_GROUPS) {
    const groupValue = form[group.key] || {};
    const lines = group.items.map(
      (item) => `${groupValue[item.key] ? CHECKED : UNCHECKED}  ${item.label}`,
    );

    if (group.key === 'otherProducts' && groupValue.others && groupValue.otherDescription) {
      lines.push(`Others: ${groupValue.otherDescription}`);
    }

    content.push({
      text: [{ text: `${group.title}\n`, style: 'subHeader' }, { text: lines.join('\n'), style: 'value' }],
      margin: [0, 0, 0, 4],
    });
  }

  return content;
}

function buildFindingsSection(findings) {
  const content = [];
  let itemIndex = 0;

  for (const section of FINDING_SECTIONS) {
    const body = [[{ text: 'Item', style: 'tableHeader' }, { text: 'Status', style: 'tableHeader' }, { text: 'Remarks', style: 'tableHeader' }]];

    for (const item of section.items) {
      const finding = getByPath(findings, `${section.key}.${item.key}`) || {};
      const status = finding.status || 'NOT_ASSESSED';
      const glyph = FINDING_STATUS_GLYPHS[status] || '';

      body.push([
        { text: itemIndex % 2 === 0 ? `(${['i', 'ii', 'iii', 'iv', 'v'][itemIndex % 5]})` : '', style: 'label' },
        { text: `${glyph}  ${item.label}` },
        { text: FINDING_STATUS_LABELS[status] || status, bold: status === 'NON_COMPLIANT' },
        { text: finding.remarks || '' },
      ]);

      itemIndex += 1;
    }

    content.push({ text: `${section.number} ${section.title}`, style: 'subHeader' });
    content.push({
      table: { headerRows: 1, widths: ['6%', '34%', '24%', '36%'], body },
      layout: 'lightHorizontalLines',
      margin: [0, 0, 0, 6],
    });
  }

  return content;
}

function buildSignatureBlock(label, signatory) {
  const value = signatory || {};
  const stack = [
    { text: label, style: 'label', margin: [0, 0, 0, 3] },
  ];

  if (value.signatureData) {
    stack.push({
      image: value.signatureData.startsWith('data:') ? value.signatureData : `data:image/png;base64,${value.signatureData}`,
      width: 120,
      height: 50,
    });
  } else {
    stack.push({ text: '..................................................', style: 'value', margin: [0, 0, 0, 6] });
  }

  stack.push({ text: `Name: ${value.name || '..................................................'}`, style: 'value' });
  stack.push({
    text: `Date: ${value.date ? new Date(value.date).toLocaleDateString() : '..................................................'}`,
    style: 'value',
  });

  return { stack, margin: [0, 0, 0, 12] };
}

function buildWorkflowTable(workflowHistory) {
  if (!workflowHistory || workflowHistory.length === 0) {
    return { text: 'No workflow history recorded.', style: 'value' };
  }

  const body = [
    [
      { text: 'Date', style: 'tableHeader' },
      { text: 'Role', style: 'tableHeader' },
      { text: 'Action', style: 'tableHeader' },
      { text: 'Reason', style: 'tableHeader' },
    ],
    ...workflowHistory.map((entry) => [
      new Date(entry.timestamp).toLocaleString(),
      entry.role || '',
      entry.action,
      entry.reason || '',
    ]),
  ];

  return {
    table: { headerRows: 1, widths: ['20%', '16%', '26%', '38%'], body },
    layout: 'lightHorizontalLines',
  };
}

function buildDocDefinition(inspection) {
  const form = inspection.formData || {};
  const outletInfo = form.outletInformation || {};
  const owner = form.ownerInformation || {};
  const signOff = form.signOff || {};
  const outletRecord = (inspection.outlet && typeof inspection.outlet === 'object' && inspection.outlet.outletName) ? inspection.outlet : {};
  const finalApproval = inspection.finalApproval || {};
  const typeLabels = { AGROVET: 'Agrovet', CHEMIST: 'Chemist', OTHER: 'Others' };

  const outletTypeValue = outletInfo.outletType || outletRecord.outletType
    ? `${typeLabels[outletInfo.outletType || outletRecord.outletType] || ''}${outletInfo.otherType ? ` - ${outletInfo.otherType}` : ''}`
    : '';

  const content = [
    buildHeader(inspection.inspectionNumber),
    { text: 'INSPECTION QUESTIONNAIRE FOR VETERINARY INPUTS OUTLETS', style: 'docTitle', margin: [0, 4, 0, 2] },
    {
      columns: [
        { text: `Date: ${new Date(inspection.inspectionDate).toLocaleDateString()}`, style: 'value' },
        {
          text: `Report status: ${STATUS_LABELS[inspection.status] || inspection.status}`,
          style: 'value',
          alignment: 'right',
          bold: true,
          color: inspection.status === 'FINAL_APPROVED' ? KVB_GREEN : KVB_NAVY,
        },
      ],
      margin: [0, 0, 0, 8],
    },
    { text: '1. Name of Outlet', style: 'sectionHeader' },
    buildInfoSection([{ label: 'Name of Outlet', value: outletInfo.outletName || outletRecord.outletName }]),

    { text: '2. Type of Outlet', style: 'sectionHeader' },
    buildInfoSection([
      { label: 'Type of Outlet', value: outletTypeValue },
      { label: 'Specify other type', value: outletInfo.otherType },
    ]),

    { text: '3. Location', style: 'sectionHeader' },
    buildInfoSection([
      { label: 'County', value: outletInfo.county || outletRecord.county },
      { label: 'Sub-County', value: outletInfo.subCounty || outletRecord.subCounty },
      { label: 'Centre', value: outletInfo.centre || outletRecord.centre },
    ]),

    { text: "4. (i) Owner's Details", style: 'sectionHeader' },
    buildInfoSection([
      { label: "Owner's Name", value: owner.ownerName || outletRecord.ownerName },
      { label: 'Address', value: owner.address || outletRecord.address },
      { label: 'Tel. No.', value: owner.telephone || outletRecord.ownerPhone },
      { label: 'Level of Training in Animal Health', value: owner.trainingLevel },
    ]),
    { text: 'KVB status', style: 'subHeader' },
    buildInfoSection(kvbStatusFields(form.kvbStatus)),

    { text: '4. (ii) Attendant(s)', style: 'sectionHeader' },
    buildAttendantTable(form.attendants),

    { text: '5. Type of Product Stocked', style: 'sectionHeader' },
    ...buildProductsSection(form.products),

    { text: 'Inspection', style: 'sectionHeader' },
    ...buildFindingsSection(form.findings),

    { text: '5. (e) Other Comments', style: 'sectionHeader' },
    { text: form.otherComments || '.................................................................', style: 'value' },

    { text: 'Sign-Off', style: 'sectionHeader' },
    buildSignatureBlock('Name of Inspector / Signature / Date', signOff.inspector),
    buildSignatureBlock('Name of Person Incharge / Signature / Date', signOff.personInCharge),
  ];

  if (finalApproval.approver) {
    content.push({
      text: `Final approval: ${new Date(finalApproval.approvedAt).toLocaleString()}`,
      style: 'label',
      margin: [0, 0, 0, 10],
    });
  }

  content.push(
    { text: 'Workflow History', style: 'sectionHeader' },
    buildWorkflowTable(inspection.workflowHistory),
    {
      text: `Generated on ${new Date().toLocaleString()} by the KVB Veterinary Inspection Portal.`,
      style: 'label',
      margin: [0, 12, 0, 0],
    },
  );

  return {
    pageSize: 'A4',
    pageOrientation: 'portrait',
    footer: (currentPage, pageCount) => ({
      text: `Page ${currentPage} of ${pageCount} | ${inspection.inspectionNumber}`,
      style: 'label',
      alignment: 'center',
    }),
    ...buildStyles(),
    content,
  };
}

function generatePdfBuffer(inspection) {
  const docDefinition = buildDocDefinition(inspection);

  return new Promise((resolve, reject) => {
    try {
      const document = PRINTER.createPdfKitDocument(docDefinition);
      const chunks = [];

      document.on('data', (chunk) => chunks.push(chunk));
      document.on('end', () => resolve(Buffer.concat(chunks)));
      document.on('error', reject);
      document.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generatePdfBuffer, buildDocDefinition };
