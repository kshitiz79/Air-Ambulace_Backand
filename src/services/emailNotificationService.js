// services/emailNotificationService.js
const { sendMail } = require('../config/email');

const fmt     = (v) => (v != null && v !== '') ? String(v) : '—';
const fmtBool = (v) => v ? '✅ Yes' : '❌ No';
const fmtDate = (d) => d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const STATUS_COLORS = {
  PENDING:            { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
  FORWARDED:          { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' },
  APPROVED:           { bg: '#d1fae5', text: '#065f46', border: '#10b981' },
  REJECTED:           { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' },
  ESCALATED:          { bg: '#ffedd5', text: '#9a3412', border: '#f97316' },
  IN_PROGRESS:        { bg: '#ede9fe', text: '#4c1d95', border: '#8b5cf6' },
  COMPLETED:          { bg: '#f3f4f6', text: '#374151', border: '#6b7280' },
  COLLECTOR_APPROVED: { bg: '#ccfbf1', text: '#134e4a', border: '#14b8a6' },
  DME_APPROVED:       { bg: '#e0e7ff', text: '#312e81', border: '#6366f1' },
};

// ─── Reusable building blocks ────────────────────────────────────────────────

const infoCard = (icon, label, value, accent = '#2563eb') => `
  <td style="padding:6px 8px;width:50%;vertical-align:top;">
    <div style="background:#f8fafc;border-left:3px solid ${accent};border-radius:0 8px 8px 0;padding:10px 12px;">
      <p style="margin:0;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;">${icon} ${label}</p>
      <p style="margin:4px 0 0;font-size:13px;font-weight:600;color:#111827;word-break:break-word;">${fmt(value)}</p>
    </div>
  </td>`;

const sectionHeader = (title, icon, color) => `
  <tr>
    <td colspan="2" style="padding:20px 24px 10px;">
      <div style="display:flex;align-items:center;gap:8px;border-bottom:2px solid ${color};padding-bottom:8px;">
        <span style="font-size:16px;">${icon}</span>
        <span style="font-size:12px;font-weight:900;color:${color};text-transform:uppercase;letter-spacing:0.12em;">${title}</span>
      </div>
    </td>
  </tr>`;

const twoColRow = (pairs, accent) => {
  const cells = pairs.map(([label, value, icon]) => infoCard(icon || '', label, value, accent));
  // pad to even
  if (cells.length % 2 !== 0) cells.push('<td style="padding:6px 8px;width:50%;"></td>');
  let rows = '';
  for (let i = 0; i < cells.length; i += 2) {
    rows += `<tr>${cells[i]}${cells[i + 1]}</tr><tr><td colspan="2" style="height:6px;"></td></tr>`;
  }
  return rows;
};

// ─── Main template ────────────────────────────────────────────────────────────

const buildEnquiryEmail = ({ enquiry: e, patientName, enquiryCode, districtName }) => {
  const sc = STATUS_COLORS[e.status] || STATUS_COLORS.PENDING;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Air Ambulance Enquiry — ${fmt(enquiryCode)}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    @media only screen and (max-width:600px){
      .email-wrapper { padding: 0 !important; }
      .email-card    { border-radius: 0 !important; }
      .header-badges { display: block !important; }
      .header-badge  { display: block !important; margin-bottom: 8px !important; width: 100% !important; box-sizing: border-box !important; }
      .two-col td    { display: block !important; width: 100% !important; box-sizing: border-box !important; }
      .hide-mobile   { display: none !important; }
      h1.title       { font-size: 18px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#eef2f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

<!-- Preheader -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
  New enquiry ${fmt(enquiryCode)} — ${fmt(patientName)} — ${fmt(districtName)} — ${fmt(e.status)}
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-wrapper" style="background:#eef2f7;padding:24px 16px;">
<tr><td align="center">

  <!-- Card -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-card"
    style="max-width:620px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.10);">

    <!-- ══ HEADER ══════════════════════════════════════════════════════════ -->
    <tr>
      <td style="background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 60%,#3b82f6 100%);padding:28px 28px 24px;">

        <!-- Logo row -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align:middle;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:14px;">
                    <div style="width:52px;height:52px;background:rgba(255,255,255,0.18);border-radius:14px;text-align:center;line-height:52px;font-size:26px;">🚑</div>
                  </td>
                  <td style="vertical-align:middle;">
                    <h1 class="title" style="margin:0;color:#ffffff;font-size:20px;font-weight:900;letter-spacing:-0.3px;line-height:1.2;">
                      New Air Ambulance Enquiry
                    </h1>
                    <p style="margin:3px 0 0;color:rgba(255,255,255,0.65);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;">
                      PM Shree Air Ambulance Seva
                    </p>
                  </td>
                </tr>
              </table>
            </td>
            <td align="right" class="hide-mobile" style="vertical-align:middle;">
              <p style="margin:0;color:rgba(255,255,255,0.5);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">Generated</p>
              <p style="margin:2px 0 0;color:rgba(255,255,255,0.85);font-size:11px;font-weight:600;">${fmtDate(e.created_at)}</p>
            </td>
          </tr>
        </table>

        <!-- Divider -->
        <div style="height:1px;background:rgba(255,255,255,0.15);margin:18px 0;"></div>

        <!-- Badges row -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="header-badges">
          <tr>
            ${[
              ['Enquiry Code', fmt(enquiryCode), 'font-family:monospace;font-size:15px;'],
              ['Status',       fmt(e.status).replace(/_/g,' '), ''],
              ['Transport',    fmt(e.air_transport_type) + ' Seva', ''],
              ['District',     fmt(districtName), ''],
            ].map(([label, value, extra]) => `
            <td class="header-badge" style="padding:0 6px 0 0;vertical-align:top;">
              <div style="background:rgba(255,255,255,0.14);border:1px solid rgba(255,255,255,0.2);border-radius:10px;padding:10px 14px;">
                <p style="margin:0;color:rgba(255,255,255,0.6);font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;">${label}</p>
                <p style="margin:4px 0 0;color:#ffffff;font-size:13px;font-weight:800;${extra}">${value}</p>
              </div>
            </td>`).join('')}
          </tr>
        </table>

      </td>
    </tr>

    <!-- ══ STATUS BANNER ═══════════════════════════════════════════════════ -->
    <tr>
      <td style="background:${sc.bg};border-left:4px solid ${sc.border};padding:12px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <p style="margin:0;font-size:11px;font-weight:800;color:${sc.text};text-transform:uppercase;letter-spacing:0.1em;">
                Current Status
              </p>
              <p style="margin:2px 0 0;font-size:14px;font-weight:900;color:${sc.text};">
                ${fmt(e.status).replace(/_/g,' ')}
              </p>
            </td>
            <td align="right">
              <p style="margin:0;font-size:11px;color:${sc.text};opacity:0.7;">ID #${fmt(e.enquiry_id)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- ══ BODY ════════════════════════════════════════════════════════════ -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">

      <!-- Patient Information -->
      ${sectionHeader('Patient Information', '👤', '#2563eb')}
      <tr><td colspan="2" style="padding:0 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="two-col">
          ${twoColRow([
            ['Patient Name',        patientName,           '👤', '#2563eb'],
            ['Father / Spouse',     e.father_spouse_name,  '👨‍👩‍👦', '#2563eb'],
            ['Age',                 e.age ? e.age + ' years' : null, '🎂', '#2563eb'],
            ['Gender',              e.gender,              '⚧', '#2563eb'],
            ['Address',             e.address,             '📍', '#2563eb'],
          ], '#2563eb')}
        </table>
      </td></tr>

      <!-- Identity Documents -->
      ${sectionHeader('Identity Documents', '🪪', '#7c3aed')}
      <tr><td colspan="2" style="padding:0 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="two-col">
          ${twoColRow([
            ['Identity Card Type',  e.identity_card_type,    '🪪', '#7c3aed'],
            ['ABHA / PM JAY No.',   e.ayushman_card_number,  '🔢', '#7c3aed'],
            ['Aadhar Card',         e.aadhar_card_number,    '🪪', '#7c3aed'],
            ['PAN Card',            e.pan_card_number,       '📄', '#7c3aed'],
          ], '#7c3aed')}
        </table>
      </td></tr>

      <!-- Medical Information -->
      ${sectionHeader('Medical Information', '🩺', '#dc2626')}
      <tr><td colspan="2" style="padding:0 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="two-col">
          ${twoColRow([
            ['Medical Condition',   e.medical_condition,   '🩺', '#dc2626'],
            ['Vitals',              e.vitals,              '❤️', '#dc2626'],
            ['Chief Complaint',     e.chief_complaint,     '📋', '#dc2626'],
            ['General Condition',   e.general_condition,   '🏥', '#dc2626'],
          ], '#dc2626')}
        </table>
      </td></tr>

      <!-- Contact Details -->
      ${sectionHeader('Contact Details', '📞', '#059669')}
      <tr><td colspan="2" style="padding:0 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="two-col">
          ${twoColRow([
            ['Contact Person',  e.contact_name,  '👤', '#059669'],
            ['Phone',           e.contact_phone, '📞', '#059669'],
            ['Email',           e.contact_email, '✉️', '#059669'],
          ], '#059669')}
        </table>
      </td></tr>

      <!-- Hospital & Routing -->
      ${sectionHeader('Hospital & Routing', '🏥', '#0891b2')}
      <tr><td colspan="2" style="padding:0 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="two-col">
          ${twoColRow([
            ['Source Hospital',        e.sourceHospital?.name || e.source_hospital_id, '🏥', '#0891b2'],
            ['Destination Hospital',   e.hospital?.name || e.hospital_id,              '🎯', '#0891b2'],
            ['District',               districtName,                                   '📍', '#0891b2'],
            ['Transport Category',     e.transportation_category,                      '🚁', '#0891b2'],
          ], '#0891b2')}
        </table>
      </td></tr>

      <!-- Referral Details -->
      ${sectionHeader('Referral Details', '📋', '#d97706')}
      <tr><td colspan="2" style="padding:0 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="two-col">
          ${twoColRow([
            ['Referring Physician',        e.referring_physician_name,              '👨‍⚕️', '#d97706'],
            ['Physician Designation',      e.referring_physician_designation,       '🏷️', '#d97706'],
            ['Recommending Authority',     e.recommending_authority_name,           '✅', '#d97706'],
            ['Recommending Designation',   e.recommending_authority_designation,    '🏷️', '#d97706'],
            ['Approval Authority',         e.approval_authority_name,               '✅', '#d97706'],
            ['Approval Designation',       e.approval_authority_designation,        '🏷️', '#d97706'],
            ['Referral Note',              e.referral_note,                         '📝', '#d97706'],
          ], '#d97706')}
        </table>
      </td></tr>

      <!-- Logistics -->
      ${sectionHeader('Logistics', '🚁', '#4f46e5')}
      <tr><td colspan="2" style="padding:0 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="two-col">
          ${twoColRow([
            ['Bed Availability',     fmtBool(e.bed_availability_confirmed),  '🛏️', '#4f46e5'],
            ['ALS Ambulance',        fmtBool(e.als_ambulance_arranged),      '🚑', '#4f46e5'],
            ['Ambulance Reg. No.',   e.ambulance_registration_number,        '🔢', '#4f46e5'],
            ['Ambulance Contact',    e.ambulance_contact,                    '📞', '#4f46e5'],
            ['Medical Team Note',    e.medical_team_note,                    '📝', '#4f46e5'],
            ['Remarks',              e.remarks,                              '💬', '#4f46e5'],
          ], '#4f46e5')}
        </table>
      </td></tr>

      <!-- Spacer -->
      <tr><td colspan="2" style="height:16px;"></td></tr>

    </table>

    <!-- ══ FOOTER ══════════════════════════════════════════════════════════ -->
    <tr>
      <td style="background:#1e293b;padding:20px 28px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <p style="margin:0;color:#94a3b8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">
                PM Shree Air Ambulance Seva
              </p>
              <p style="margin:4px 0 0;color:#64748b;font-size:10px;">
                airambulance@flyolaindia.com &nbsp;·&nbsp; Automated Notification — Do not reply
              </p>
            </td>
            <td align="right" class="hide-mobile">
              <div style="width:36px;height:36px;background:rgba(255,255,255,0.08);border-radius:10px;text-align:center;line-height:36px;font-size:18px;">🚑</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

  </table>
  <!-- /Card -->

  <!-- Bottom note -->
  <p style="text-align:center;color:#94a3b8;font-size:10px;margin:16px 0 0;">
    This is an automated email. Enquiry ID #${fmt(e.enquiry_id)} · ${fmtDate(e.created_at)}
  </p>

</td></tr>
</table>

</body>
</html>`;

  const text = [
    `NEW AIR AMBULANCE ENQUIRY`,
    `═══════════════════════════════`,
    `Code    : ${fmt(enquiryCode)}`,
    `Patient : ${fmt(patientName)}`,
    `District: ${fmt(districtName)}`,
    `Status  : ${fmt(e.status)}`,
    `Type    : ${fmt(e.air_transport_type)} Seva`,
    ``,
    `PATIENT`,
    `Father/Spouse : ${fmt(e.father_spouse_name)}`,
    `Age / Gender  : ${fmt(e.age)} / ${fmt(e.gender)}`,
    `Address       : ${fmt(e.address)}`,
    ``,
    `MEDICAL`,
    `Condition     : ${fmt(e.medical_condition)}`,
    `Vitals        : ${fmt(e.vitals)}`,
    `Chief Complaint: ${fmt(e.chief_complaint)}`,
    ``,
    `CONTACT`,
    `Name  : ${fmt(e.contact_name)}`,
    `Phone : ${fmt(e.contact_phone)}`,
    `Email : ${fmt(e.contact_email)}`,
    ``,
    `HOSPITAL`,
    `Source      : ${fmt(e.sourceHospital?.name || e.source_hospital_id)}`,
    `Destination : ${fmt(e.hospital?.name || e.hospital_id)}`,
    ``,
    `Created: ${fmtDate(e.created_at)}`,
    `ID: #${fmt(e.enquiry_id)}`,
  ].join('\n');

  return { html, text };
};

// ─── Send function ────────────────────────────────────────────────────────────

const sendEnquiryCreatedEmails = async ({ enquiry, districtName, dmEmail, extraEmails = [] }) => {
  try {
    const patientName = enquiry.patient_name || 'Unknown';
    const enquiryCode = enquiry.enquiry_code || `ENQ-${enquiry.enquiry_id}`;
    const subject     = `🚑 New Enquiry: ${enquiryCode} — ${patientName} (${districtName || 'N/A'})`;

    const { html, text } = buildEnquiryEmail({ enquiry, patientName, enquiryCode, districtName });

    const recipients = new Set(['airambulance@flyolaindia.com']);
    if (dmEmail) recipients.add(dmEmail);
    extraEmails.forEach(e => { if (e && e.includes('@')) recipients.add(e.trim()); });

    const results = await Promise.allSettled(
      [...recipients].map(email => sendMail(email, subject, text, html))
    );

    results.forEach((r, i) => {
      const email = [...recipients][i];
      if (r.status === 'rejected') {
        console.error(`Email failed for ${email}:`, r.reason?.message);
      } else {
        console.log(`Email sent to ${email}: ${r.value ? 'OK' : 'FAILED'}`);
      }
    });
  } catch (err) {
    console.error('Email notification error (non-fatal):', err.message);
  }
};

module.exports = { sendEnquiryCreatedEmails };
