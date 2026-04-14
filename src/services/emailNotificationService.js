// services/emailNotificationService.js
// Sends email notifications on enquiry creation

const { sendMail } = require('../config/email');

/**
 * Build a rich HTML email with full enquiry details
 */
const buildEnquiryEmail = ({ enquiry, patientName, enquiryCode, districtName }) => {
  const e = enquiry;
  const fmt = (v) => v || '—';
  const fmtBool = (v) => (v ? 'Yes' : 'No');
  const fmtDate = (d) => d ? new Date(d).toLocaleString('en-IN') : '—';

  const row = (label, value) => `
    <tr>
      <td style="padding:8px 12px;font-size:12px;font-weight:600;color:#6b7280;background:#f9fafb;border-bottom:1px solid #f3f4f6;white-space:nowrap;width:200px;">${label}</td>
      <td style="padding:8px 12px;font-size:13px;color:#111827;border-bottom:1px solid #f3f4f6;">${fmt(value)}</td>
    </tr>`;

  const section = (title, color, rows) => `
    <tr><td colspan="2" style="padding:14px 12px 6px;font-size:11px;font-weight:900;color:${color};text-transform:uppercase;letter-spacing:0.1em;background:#fff;border-top:3px solid ${color};">${title}</td></tr>
    ${rows}`;

  const statusColor = {
    PENDING: '#f59e0b', APPROVED: '#10b981', REJECTED: '#ef4444',
    ESCALATED: '#f97316', FORWARDED: '#3b82f6', IN_PROGRESS: '#8b5cf6',
    COMPLETED: '#6b7280', COLLECTOR_APPROVED: '#14b8a6', DME_APPROVED: '#6366f1',
  }[e.status] || '#6b7280';

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <div style="max-width:680px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1d4ed8,#2563eb);padding:28px 32px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="width:48px;height:48px;background:rgba(255,255,255,0.2);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:24px;">🚑</div>
        <div>
          <h1 style="margin:0;color:#fff;font-size:20px;font-weight:900;letter-spacing:-0.5px;">New Air Ambulance Enquiry</h1>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;">PM Shree Air Ambulance Seva</p>
        </div>
      </div>
      <div style="margin-top:20px;display:flex;gap:12px;flex-wrap:wrap;">
        <div style="background:rgba(255,255,255,0.15);border-radius:8px;padding:10px 16px;">
          <p style="margin:0;color:rgba(255,255,255,0.7);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">Enquiry Code</p>
          <p style="margin:4px 0 0;color:#fff;font-size:16px;font-weight:900;font-family:monospace;">${fmt(enquiryCode)}</p>
        </div>
        <div style="background:rgba(255,255,255,0.15);border-radius:8px;padding:10px 16px;">
          <p style="margin:0;color:rgba(255,255,255,0.7);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">Status</p>
          <p style="margin:4px 0 0;color:#fff;font-size:14px;font-weight:900;">${fmt(e.status)}</p>
        </div>
        <div style="background:rgba(255,255,255,0.15);border-radius:8px;padding:10px 16px;">
          <p style="margin:0;color:rgba(255,255,255,0.7);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">Transport Type</p>
          <p style="margin:4px 0 0;color:#fff;font-size:14px;font-weight:900;">${fmt(e.air_transport_type)} Seva</p>
        </div>
        <div style="background:rgba(255,255,255,0.15);border-radius:8px;padding:10px 16px;">
          <p style="margin:0;color:rgba(255,255,255,0.7);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">District</p>
          <p style="margin:4px 0 0;color:#fff;font-size:14px;font-weight:900;">${fmt(districtName)}</p>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div style="padding:0 0 24px;">
      <table style="width:100%;border-collapse:collapse;">

        ${section('Patient Information', '#2563eb',
          row('Patient Name', patientName) +
          row('Father / Spouse Name', e.father_spouse_name) +
          row('Age', e.age) +
          row('Gender', e.gender) +
          row('Address', e.address)
        )}

        ${section('Identity Documents', '#7c3aed',
          row('Identity Card Type', e.identity_card_type) +
          row('ABHA / PM JAY Number', e.ayushman_card_number) +
          row('Aadhar Card Number', e.aadhar_card_number) +
          row('PAN Card Number', e.pan_card_number)
        )}

        ${section('Medical Information', '#dc2626',
          row('Medical Condition', e.medical_condition) +
          row('Chief Complaint', e.chief_complaint) +
          row('General Condition', e.general_condition) +
          row('Vitals', e.vitals)
        )}

        ${section('Contact Details', '#059669',
          row('Contact Person', e.contact_name) +
          row('Contact Phone', e.contact_phone) +
          row('Contact Email', e.contact_email)
        )}

        ${section('Hospital & Routing', '#0891b2',
          row('Source Hospital', e.sourceHospital?.name || e.source_hospital_id) +
          row('Destination Hospital', e.hospital?.name || e.hospital_id) +
          row('District', districtName) +
          row('Transportation Category', e.transportation_category)
        )}

        ${section('Referral Details', '#d97706',
          row('Referring Physician', e.referring_physician_name) +
          row('Physician Designation', e.referring_physician_designation) +
          row('Referral Note', e.referral_note) +
          row('Recommending Authority', e.recommending_authority_name) +
          row('Recommending Designation', e.recommending_authority_designation) +
          row('Approval Authority', e.approval_authority_name) +
          row('Approval Designation', e.approval_authority_designation)
        )}

        ${section('Logistics', '#4f46e5',
          row('Bed Availability Confirmed', fmtBool(e.bed_availability_confirmed)) +
          row('ALS Ambulance Arranged', fmtBool(e.als_ambulance_arranged)) +
          row('Ambulance Reg. Number', e.ambulance_registration_number) +
          row('Ambulance Contact', e.ambulance_contact) +
          row('Medical Team Note', e.medical_team_note) +
          row('Remarks', e.remarks)
        )}

        ${section('Timestamps', '#6b7280',
          row('Created At', fmtDate(e.created_at)) +
          row('Enquiry ID', e.enquiry_id)
        )}

      </table>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 24px;text-align:center;">
      <p style="margin:0;font-size:11px;color:#9ca3af;font-weight:600;">
        PM Shree Air Ambulance Seva · Automated Notification · Do not reply to this email
      </p>
      <p style="margin:4px 0 0;font-size:11px;color:#9ca3af;">
        airambulance@flyolaindia.com
      </p>
    </div>
  </div>
</body>
</html>`;

  const text = `New Air Ambulance Enquiry\n\nCode: ${enquiryCode}\nPatient: ${patientName}\nDistrict: ${districtName}\nStatus: ${e.status}\nTransport: ${e.air_transport_type}\nMedical Condition: ${e.medical_condition}\nContact: ${e.contact_name} | ${e.contact_phone}\nCreated: ${fmtDate(e.created_at)}`;

  return { html, text };
};

/**
 * Send enquiry notification emails to:
 * - airambulance@flyolaindia.com (always)
 * - DM/Collector of that district (from users table)
 * - Extra emails configured in EmailConfig
 */
const sendEnquiryCreatedEmails = async ({ enquiry, districtName, dmEmail, extraEmails = [] }) => {
  try {
    const patientName = enquiry.patient_name || 'Unknown';
    const enquiryCode = enquiry.enquiry_code || `ENQ-${enquiry.enquiry_id}`;
    const subject = `🚑 New Enquiry: ${enquiryCode} — ${patientName} (${districtName || 'N/A'})`;

    const { html, text } = buildEnquiryEmail({ enquiry, patientName, enquiryCode, districtName });

    // Build recipient list — deduplicate
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
    // Never throw — don't break enquiry creation
  }
};

module.exports = { sendEnquiryCreatedEmails };
