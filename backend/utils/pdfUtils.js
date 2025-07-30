import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the PDF directory exists
const ensurePdfDirectory = async () => {
  const pdfDir = path.join(__dirname, '../pdfs');
  try {
    await fs.access(pdfDir);
  } catch (error) {
    await fs.mkdir(pdfDir, { recursive: true });
  }
  return pdfDir;
};

/**
 * Generate an invoice PDF for a payment
 * @param {Object} paymentData - Payment data including user, doctor, appointment details
 * @returns {Promise<string>} - Path to the generated PDF file
 */
const generateInvoicePdf = async (paymentData) => {
  const {
    _id,
    appointmentId,
    userId,
    doctorId,
    amount,
    paymentMethod,
    paymentId,
    orderId,
    status,
    createdAt
  } = paymentData;

  const pdfDir = await ensurePdfDirectory();
  const outputPath = path.join(pdfDir, `invoice_${_id}.pdf`);

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  // Format date for display
  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Create HTML content for the invoice
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Payment Invoice</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          color: #333;
        }
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 30px;
          border: 1px solid #eee;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
          font-size: 14px;
          line-height: 24px;
        }
        .invoice-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          border-bottom: 1px solid #eee;
          padding-bottom: 20px;
        }
        .invoice-title {
          font-size: 24px;
          font-weight: bold;
          color: #0066cc;
        }
        .invoice-details {
          margin-bottom: 40px;
        }
        .invoice-details-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .invoice-details-label {
          font-weight: bold;
          width: 150px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        table th, table td {
          padding: 10px;
          border: 1px solid #eee;
          text-align: left;
        }
        table th {
          background-color: #f8f8f8;
        }
        .total-row {
          font-weight: bold;
          font-size: 16px;
          background-color: #f8f8f8;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 12px;
          color: #777;
        }
        .payment-status {
          display: inline-block;
          padding: 5px 10px;
          border-radius: 4px;
          font-weight: bold;
          text-transform: uppercase;
          font-size: 12px;
        }
        .status-completed {
          background-color: #d4edda;
          color: #155724;
        }
        .status-pending {
          background-color: #fff3cd;
          color: #856404;
        }
        .status-refunded {
          background-color: #f8d7da;
          color: #721c24;
        }
        .status-failed {
          background-color: #f8d7da;
          color: #721c24;
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="invoice-header">
          <div>
            <div class="invoice-title">PRESCRIPTO</div>
            <div>Healthcare Services</div>
          </div>
          <div>
            <div class="invoice-title">INVOICE</div>
            <div>Invoice #: INV-${_id.toString().slice(-6).toUpperCase()}</div>
            <div>Date: ${formattedDate}</div>
          </div>
        </div>
        
        <div class="invoice-details">
          <div class="invoice-details-row">
            <div class="invoice-details-label">Patient:</div>
            <div>${userId.name}</div>
          </div>
          <div class="invoice-details-row">
            <div class="invoice-details-label">Email:</div>
            <div>${userId.email}</div>
          </div>
          <div class="invoice-details-row">
            <div class="invoice-details-label">Doctor:</div>
            <div>Dr. ${doctorId.name}</div>
          </div>
          <div class="invoice-details-row">
            <div class="invoice-details-label">Speciality:</div>
            <div>${doctorId.speciality}</div>
          </div>
          <div class="invoice-details-row">
            <div class="invoice-details-label">Appointment ID:</div>
            <div>${appointmentId.appointmentId}</div>
          </div>
          <div class="invoice-details-row">
            <div class="invoice-details-label">Appointment Date:</div>
            <div>${new Date(appointmentId.appointmentDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</div>
          </div>
          <div class="invoice-details-row">
            <div class="invoice-details-label">Appointment Time:</div>
            <div>${appointmentId.appointmentTime}</div>
          </div>
          <div class="invoice-details-row">
            <div class="invoice-details-label">Payment Method:</div>
            <div>${paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}</div>
          </div>
          <div class="invoice-details-row">
            <div class="invoice-details-label">Transaction ID:</div>
            <div>${paymentId || 'N/A'}</div>
          </div>
          <div class="invoice-details-row">
            <div class="invoice-details-label">Order ID:</div>
            <div>${orderId || 'N/A'}</div>
          </div>
          <div class="invoice-details-row">
            <div class="invoice-details-label">Payment Status:</div>
            <div>
              <span class="payment-status status-${status}">
                ${status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Medical Consultation - Dr. ${doctorId.name} (${doctorId.speciality})</td>
              <td>₹${amount.toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <td>Total</td>
              <td>₹${amount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="footer">
          <p>Thank you for choosing Prescripto Healthcare Services.</p>
          <p>For any queries regarding this invoice, please contact support@prescripto.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(htmlContent);
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20px',
      right: '20px',
      bottom: '20px',
      left: '20px'
    }
  });

  await browser.close();
  return outputPath;
};

/**
 * Generate an appointment slip PDF
 * @param {Object} appointmentData - Appointment data including user, doctor details
 * @returns {Promise<string>} - Path to the generated PDF file
 */
const generateAppointmentSlipPdf = async (appointmentData) => {
  const {
    _id,
    appointmentId,
    doctorId,
    userId,
    appointmentDate,
    appointmentTime,
    status,
    paymentStatus,
    fees
  } = appointmentData;

  const pdfDir = await ensurePdfDirectory();
  const outputPath = path.join(pdfDir, `appointment_${_id}.pdf`);

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  // Format date for display
  const formattedDate = new Date(appointmentDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Create HTML content for the appointment slip
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Appointment Slip</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          color: #333;
        }
        .appointment-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 30px;
          border: 1px solid #eee;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
          font-size: 14px;
          line-height: 24px;
        }
        .appointment-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          border-bottom: 1px solid #eee;
          padding-bottom: 20px;
        }
        .appointment-title {
          font-size: 24px;
          font-weight: bold;
          color: #0066cc;
        }
        .appointment-details {
          margin-bottom: 40px;
        }
        .appointment-details-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .appointment-details-label {
          font-weight: bold;
          width: 150px;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 12px;
          color: #777;
        }
        .appointment-status {
          display: inline-block;
          padding: 5px 10px;
          border-radius: 4px;
          font-weight: bold;
          text-transform: uppercase;
          font-size: 12px;
        }
        .status-confirmed {
          background-color: #d4edda;
          color: #155724;
        }
        .status-pending {
          background-color: #fff3cd;
          color: #856404;
        }
        .status-cancelled {
          background-color: #f8d7da;
          color: #721c24;
        }
        .status-completed {
          background-color: #cce5ff;
          color: #004085;
        }
        .payment-status {
          display: inline-block;
          padding: 5px 10px;
          border-radius: 4px;
          font-weight: bold;
          text-transform: uppercase;
          font-size: 12px;
        }
        .payment-completed {
          background-color: #d4edda;
          color: #155724;
        }
        .payment-pending {
          background-color: #fff3cd;
          color: #856404;
        }
        .payment-refunded {
          background-color: #f8d7da;
          color: #721c24;
        }
        .notes {
          background-color: #f9f9f9;
          padding: 15px;
          border-radius: 5px;
          margin-top: 20px;
        }
        .qr-placeholder {
          width: 100px;
          height: 100px;
          border: 1px dashed #ccc;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 20px;
          font-size: 12px;
          color: #777;
        }
      </style>
    </head>
    <body>
      <div class="appointment-container">
        <div class="appointment-header">
          <div>
            <div class="appointment-title">PRESCRIPTO</div>
            <div>Healthcare Services</div>
          </div>
          <div>
            <div class="appointment-title">APPOINTMENT SLIP</div>
            <div>Appointment ID: ${appointmentId}</div>
            <div>Date: ${formattedDate}</div>
          </div>
        </div>
        
        <div class="appointment-details">
          <div class="appointment-details-row">
            <div class="appointment-details-label">Patient Name:</div>
            <div>${userId.name}</div>
          </div>
          <div class="appointment-details-row">
            <div class="appointment-details-label">Email:</div>
            <div>${userId.email}</div>
          </div>
          <div class="appointment-details-row">
            <div class="appointment-details-label">Phone:</div>
            <div>${userId.phone || 'N/A'}</div>
          </div>
          <div class="appointment-details-row">
            <div class="appointment-details-label">Doctor:</div>
            <div>Dr. ${doctorId.name}</div>
          </div>
          <div class="appointment-details-row">
            <div class="appointment-details-label">Speciality:</div>
            <div>${doctorId.speciality}</div>
          </div>
          <div class="appointment-details-row">
            <div class="appointment-details-label">Doctor Contact:</div>
            <div>${doctorId.phone || 'N/A'}</div>
          </div>
          <div class="appointment-details-row">
            <div class="appointment-details-label">Doctor Address:</div>
            <div>${doctorId.address || 'N/A'}</div>
          </div>
          <div class="appointment-details-row">
            <div class="appointment-details-label">Appointment Date:</div>
            <div>${formattedDate}</div>
          </div>
          <div class="appointment-details-row">
            <div class="appointment-details-label">Appointment Time:</div>
            <div>${appointmentTime}</div>
          </div>
          <div class="appointment-details-row">
            <div class="appointment-details-label">Consultation Fee:</div>
            <div>₹${fees.toFixed(2)}</div>
          </div>
          <div class="appointment-details-row">
            <div class="appointment-details-label">Appointment Status:</div>
            <div>
              <span class="appointment-status status-${status}">
                ${status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </div>
          </div>
          <div class="appointment-details-row">
            <div class="appointment-details-label">Payment Status:</div>
            <div>
              <span class="payment-status payment-${paymentStatus}">
                ${paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
              </span>
            </div>
          </div>
        </div>
        
        <div class="notes">
          <strong>Important Notes:</strong>
          <ul>
            <li>Please arrive 15 minutes before your scheduled appointment time.</li>
            <li>Bring your ID proof and any previous medical records if available.</li>
            <li>Rescheduling must be done at least 24 hours before the appointment time.</li>
            <li>For any queries, please contact our helpdesk at support@prescripto.com</li>
          </ul>
        </div>
        
        <div class="footer">
          <p>Thank you for choosing Prescripto Healthcare Services.</p>
          <div class="qr-placeholder">QR Code</div>
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(htmlContent);
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20px',
      right: '20px',
      bottom: '20px',
      left: '20px'
    }
  });

  await browser.close();
  return outputPath;
}; 

/**
 * Generate a combined receipt with both appointment and payment information
 * @param {Object} appointmentData - Appointment data
 * @param {Object} paymentData - Payment data
 * @returns {Promise<string>} - Path to the generated PDF file
 */
const generateCombinedReceiptPdf = async (appointmentData, paymentData) => {
  const pdfDir = await ensurePdfDirectory();
  const outputPath = path.join(pdfDir, `receipt_${appointmentData._id}_${paymentData._id}.pdf`);

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  // Format dates for display
  const appointmentDate = new Date(appointmentData.appointmentDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const paymentDate = new Date(paymentData.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Create HTML content for the combined receipt
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Combined Receipt</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          color: #333;
        }
        .receipt-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 30px;
          border: 1px solid #eee;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
          font-size: 14px;
          line-height: 24px;
        }
        .receipt-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          border-bottom: 1px solid #eee;
          padding-bottom: 20px;
        }
        .receipt-title {
          font-size: 24px;
          font-weight: bold;
          color: #0066cc;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          margin: 20px 0 10px;
          padding-bottom: 5px;
          border-bottom: 1px solid #eee;
        }
        .details-section {
          margin-bottom: 30px;
        }
        .details-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .details-label {
          font-weight: bold;
          width: 200px;
        }
        .status-badge {
          display: inline-block;
          padding: 5px 10px;
          border-radius: 4px;
          font-weight: bold;
          text-transform: uppercase;
          font-size: 12px;
        }
        .status-completed, .status-confirmed {
          background-color: #d4edda;
          color: #155724;
        }
        .status-pending {
          background-color: #fff3cd;
          color: #856404;
        }
        .status-cancelled, .status-failed, .status-refunded {
          background-color: #f8d7da;
          color: #721c24;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        table th, table td {
          padding: 10px;
          border: 1px solid #eee;
          text-align: left;
        }
        table th {
          background-color: #f8f8f8;
        }
        .total-row {
          font-weight: bold;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 12px;
          color: #777;
          border-top: 1px solid #eee;
          padding-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="receipt-header">
          <div>
            <div class="receipt-title">PRESCRIPTO</div>
            <div>Healthcare Services</div>
          </div>
          <div>
            <div class="receipt-title">COMBINED RECEIPT</div>
            <div>Receipt #: REC-${appointmentData.appointmentId}-${paymentData._id.toString().slice(-4).toUpperCase()}</div>
            <div>Date: ${paymentDate}</div>
          </div>
        </div>
        
        <div class="section-title">Patient Information</div>
        <div class="details-section">
          <div class="details-row">
            <div class="details-label">Patient Name:</div>
            <div>${appointmentData.userId.name}</div>
          </div>
          <div class="details-row">
            <div class="details-label">Email:</div>
            <div>${appointmentData.userId.email}</div>
          </div>
          <div class="details-row">
            <div class="details-label">Phone:</div>
            <div>${appointmentData.userId.phone || 'N/A'}</div>
          </div>
        </div>
        
        <div class="section-title">Doctor Information</div>
        <div class="details-section">
          <div class="details-row">
            <div class="details-label">Doctor:</div>
            <div>Dr. ${appointmentData.doctorId.name}</div>
          </div>
          <div class="details-row">
            <div class="details-label">Speciality:</div>
            <div>${appointmentData.doctorId.speciality}</div>
          </div>
          <div class="details-row">
            <div class="details-label">Contact:</div>
            <div>${appointmentData.doctorId.phone || 'N/A'}</div>
          </div>
        </div>
        
        <div class="section-title">Appointment Details</div>
        <div class="details-section">
          <div class="details-row">
            <div class="details-label">Appointment ID:</div>
            <div>${appointmentData.appointmentId}</div>
          </div>
          <div class="details-row">
            <div class="details-label">Date:</div>
            <div>${appointmentDate}</div>
          </div>
          <div class="details-row">
            <div class="details-label">Time:</div>
            <div>${appointmentData.appointmentTime}</div>
          </div>
          <div class="details-row">
            <div class="details-label">Status:</div>
            <div>
              <span class="status-badge status-${appointmentData.status}">
                ${appointmentData.status.charAt(0).toUpperCase() + appointmentData.status.slice(1)}
              </span>
            </div>
          </div>
        </div>
        
        <div class="section-title">Payment Details</div>
        <div class="details-section">
          <div class="details-row">
            <div class="details-label">Payment ID:</div>
            <div>${paymentData.paymentId || 'N/A'}</div>
          </div>
          <div class="details-row">
            <div class="details-label">Order ID:</div>
            <div>${paymentData.orderId || 'N/A'}</div>
          </div>
          <div class="details-row">
            <div class="details-label">Payment Method:</div>
            <div>${paymentData.paymentMethod.charAt(0).toUpperCase() + paymentData.paymentMethod.slice(1)}</div>
          </div>
          <div class="details-row">
            <div class="details-label">Payment Date:</div>
            <div>${paymentDate}</div>
          </div>
          <div class="details-row">
            <div class="details-label">Status:</div>
            <div>
              <span class="status-badge status-${paymentData.status}">
                ${paymentData.status.charAt(0).toUpperCase() + paymentData.status.slice(1)}
              </span>
            </div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Medical Consultation - Dr. ${appointmentData.doctorId.name} (${appointmentData.doctorId.speciality})</td>
              <td>₹${paymentData.amount.toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <td>Total</td>
              <td>₹${paymentData.amount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="footer">
          <p>Thank you for choosing Prescripto Healthcare Services.</p>
          <p>This is an electronically generated receipt and does not require a signature.</p>
          <p>For any queries, please contact support@prescripto.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(htmlContent);
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20px',
      right: '20px',
      bottom: '20px',
      left: '20px'
    }
  });

  await browser.close();
  return outputPath;
};

export {
  generateInvoicePdf,
  generateAppointmentSlipPdf,
  generateCombinedReceiptPdf,
  ensurePdfDirectory
};