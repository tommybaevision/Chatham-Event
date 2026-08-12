// netlify/functions/submit-registration.js
// Handles form submissions and writes to Google Sheets via Apps Script Web App

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Parse URL-encoded form body
    const params = new URLSearchParams(event.body);
    const data = Object.fromEntries(params.entries());

    // Add timestamp (Sydney time)
    data.submittedAt = new Date().toLocaleString('en-AU', {
      timeZone: 'Australia/Sydney',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    // Send to Google Apps Script Web App
    const sheetsUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
    if (!sheetsUrl) {
      console.error('GOOGLE_SHEETS_WEBHOOK_URL not set');
      return { statusCode: 500, body: 'Server configuration error' };
    }

    const response = await fetch(sheetsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Sheets webhook error: ${response.status}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };

  } catch (err) {
    console.error('Registration error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Submission failed' })
    };
  }
};
