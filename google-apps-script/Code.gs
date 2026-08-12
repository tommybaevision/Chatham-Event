/**
 * CHATHAM EVENT REGISTRATION — Google Apps Script
 * ─────────────────────────────────────────────────
 * 1. Open Google Sheets → Extensions → Apps Script
 * 2. Paste this entire file → Save
 * 3. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the Web App URL → paste into Netlify env var GOOGLE_SHEETS_WEBHOOK_URL
 */

const SHEET_NAME = 'Registrations';

// Column headers (order matters — matches the row builder below)
const HEADERS = [
  'Submitted At',
  'Agency Name',
  'Agent Full Name',
  'Agent Mobile',
  'Agent Email',
  'Client Full Name',
  'Client Mobile (last 3)',
  'Attendees',
  'Property Type',
  'Buyer Type',
  // HTB fields
  'Australian Citizen?',
  'Age 18+?',
  'Live In Property?',
  'Owns Other Property?',
  'Application Type',
  'Income Range',
  'HTB Deposit Available',
  'Lender Status',
  // General buyer fields
  'First Home Buyer?',
  'Gen Deposit Available',
  'Purchase Budget',
  'Finance Status',
];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    // Create sheet + headers on first run
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(HEADERS);
      // Style header row
      const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
      headerRange.setBackground('#1B3A2D');
      headerRange.setFontColor('#D4AF60');
      headerRange.setFontWeight('bold');
      headerRange.setFontSize(11);
      sheet.setFrozenRows(1);
      sheet.setColumnWidths(1, HEADERS.length, 180);
    }

    // Map buyer type label
    const buyerTypeMap = {
      'htb':        'Help to Buy buyer',
      'htb_unsure': 'Not sure – needs HTB assessment',
      'general':    'Other home buyer (not HTB)',
    };

    // Map attendees label
    let attendees = data.attendees || '';
    if (attendees === 'client_only')    attendees = 'Client only';
    if (attendees === 'client_partner') attendees = 'Client + partner';

    // Map property type
    const propTypeMap = {
      '1bed':    '1 Bedroom',
      '2bed':    '2 Bedroom',
      '3bed':    '3 Bedroom',
      'notsure': 'Not sure yet',
    };

    // Map income
    const incomeMap = {
      'single_under':  'Single ≤ $103,000',
      'single_over':   'Single > $103,000',
      'single_notsure':'Single – Not sure',
      'joint_under':   'Joint/SP ≤ $165,000',
      'joint_over':    'Joint/SP > $165,000',
      'joint_notsure': 'Joint/SP – Not sure',
    };

    // Map HTB deposit
    const htbDepositMap = {
      'under20k':  'Under $20,000',
      '20to50k':   '$20,000–$50,000',
      '50to100k':  '$50,000–$100,000',
      'over100k':  '$100,000+',
    };

    // Map lender status
    const lenderMap = {
      'preapproved': 'Pre-approved',
      'capacity':    'Borrowing capacity checked',
      'notyet':      'Not yet',
    };

    // Map general deposit
    const genDepositMap = {
      'under50k':   'Under $50k',
      '50to100k':   '$50k–$100k',
      '100to200k':  '$100k–$200k',
      'over200k':   '$200k+',
    };

    // Map budget
    const budgetMap = {
      'under800k':  'Under $800k',
      '800to1m':    '$800k–$1.0M',
      '1m_to_1_2m': '$1.0M–$1.2M',
      'over1_2m':   '$1.2M+',
    };

    // Map finance
    const financeMap = {
      'preapproved':   'Pre-approved',
      'capacity':      'Borrowing capacity checked',
      'notassessed':   'Not yet assessed',
      'cash':          'Cash buyer',
    };

    // Build row in header order
    const row = [
      data.submittedAt || new Date().toISOString(),
      data.agencyName   || '',
      data.agentName    || '',
      data.agentMobile  || '',
      data.agentEmail   || '',
      data.clientName   || '',
      data.clientMobile3 || '',
      attendees,
      propTypeMap[data.propType] || data.propType || '',
      buyerTypeMap[data.buyerType] || data.buyerType || '',
      // HTB fields
      data.citizen      || '',
      data.ageOk        || '',
      data.liveIn       || '',
      data.ownsProperty || '',
      data.appType      || '',
      incomeMap[data.income] || data.income || '',
      htbDepositMap[data.htbDeposit] || data.htbDeposit || '',
      lenderMap[data.lenderStatus] || data.lenderStatus || '',
      // General buyer fields
      data.fhb          || '',
      genDepositMap[data.genDeposit] || data.genDeposit || '',
      budgetMap[data.budget] || data.budget || '',
      financeMap[data.finance] || data.finance || '',
    ];

    sheet.appendRow(row);

    // Auto-resize rows
    sheet.autoResizeRows(sheet.getLastRow(), 1);

    // Optional: send email notification
    sendNotificationEmail(data);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    console.error('Apps Script error:', err);
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Optional email notification to organiser on each new registration.
 * Update NOTIFY_EMAIL below to enable.
 */
function sendNotificationEmail(data) {
  const NOTIFY_EMAIL = '';  // ← set your email here, e.g. 'kate@example.com'
  if (!NOTIFY_EMAIL) return;

  const subject = `New Registration: ${data.clientName || 'Unknown'} via ${data.agentName || 'Unknown Agent'}`;
  const body = `
New registration received for the Chatham Client Information Session.

AGENT: ${data.agentName} (${data.agencyName})
Mobile: ${data.agentMobile}
Email:  ${data.agentEmail}

CLIENT: ${data.clientName}
Mobile last 3: ${data.clientMobile3}
Attendees: ${data.attendees}

Property interest: ${data.propType}
Buyer type: ${data.buyerType}

Submitted: ${data.submittedAt}
  `.trim();

  MailApp.sendEmail({ to: NOTIFY_EMAIL, subject, body });
}
