import mjml2html from 'mjml';
import { embedLogoInTemplate } from './logoUtils.js';

/**
 * Generates an OTP verification email template using MJML
 * @param {string} otp - The OTP code to include in the email
 * @param {string} purpose - The purpose of the OTP (verification, password-reset, etc.)
 * @returns {string} - The compiled HTML from the MJML template
 */
export const generateOTPEmailTemplate = (otp, purpose = 'verification') => {
  let title, subtitle;
  
  if (purpose === 'verification') {
    title = 'Email Verification';
    subtitle = 'Please verify your email address to complete your registration.';
  } else if (purpose === 'password-reset') {
    title = 'Password Reset';
    subtitle = 'You requested to reset your password. Please use the following OTP to proceed.';
  } else {
    title = `OTP for ${purpose}`;
    subtitle = `You requested an OTP for ${purpose}. Please use the following OTP to proceed.`;
  }

  let mjmlTemplate = `
    <mjml>
      <mj-head>
        <mj-title>Prescripto - ${title}</mj-title>
        <mj-font name="TikTok Sans" href="https://fonts.googleapis.com/css2?family=TikTok+Sans:opsz,wght@12..36,300..900&display=swap" />
        <mj-attributes>
          <mj-all font-family="'TikTok Sans', Arial, sans-serif" />
          <mj-text font-weight="400" font-size="16px" color="#000000" line-height="24px" />
          <mj-section padding="0px" />
        </mj-attributes>
        <mj-style inline="inline">
          .otp-code {
            letter-spacing: 8px;
            font-size: 32px;
            font-weight: 700;
          }
        </mj-style>
      </mj-head>
      <mj-body background-color="#f4f4f4">
        <mj-section padding="20px 0">
          <mj-column>
            <mj-image width="180px" src="https://raw.githubusercontent.com/user/repo/main/prescripto-logo.png" alt="Prescripto Logo" align="center" />
          </mj-column>
        </mj-section>
        
        <mj-section background-color="#ffffff" border-radius="8px" padding="20px">
          <mj-column>
            <mj-text font-size="24px" color="#4a90e2" font-weight="700" align="center" padding-bottom="10px">
              Prescripto - ${title}
            </mj-text>
            
            <mj-text align="center" padding-bottom="20px">
              ${subtitle}
            </mj-text>
            
            <mj-section background-color="#f5f5f5" border-radius="8px" padding="15px">
              <mj-column>
                <mj-text css-class="otp-code" align="center" font-size="32px" font-weight="700">
                  ${otp}
                </mj-text>
              </mj-column>
            </mj-section>
            
            <mj-text align="center" font-size="14px" padding-top="15px">
              This OTP will expire in 10 minutes.
            </mj-text>
            
            <mj-text align="center" font-size="14px" padding-top="10px">
              If you did not request this ${purpose === 'password-reset' ? 'password reset' : 'verification'}, please ignore this email${purpose === 'password-reset' ? ' or contact support if you believe this is suspicious activity' : ''}.
            </mj-text>
            
            <mj-divider border-width="1px" border-color="#e0e0e0" padding="20px 0" />
            
            <mj-text align="center" font-size="14px" color="#666666">
              Thank you,<br />
              Prescripto Team
            </mj-text>
          </mj-column>
        </mj-section>
        
        <mj-section padding="20px 0">
          <mj-column>
            <mj-text align="center" font-size="12px" color="#666666">
              © ${new Date().getFullYear()} Prescripto. All rights reserved.
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  `;

  // Embed the logo in the template
  mjmlTemplate = embedLogoInTemplate(mjmlTemplate);

  // Compile the MJML to HTML
  const { html } = mjml2html(mjmlTemplate);
  return html;
};

/**
 * Generates an appointment confirmation email template using MJML
 * @param {Object} appointment - The appointment details
 * @returns {string} - The compiled HTML from the MJML template
 */
export const generateAppointmentEmailTemplate = (appointment) => {
  const { 
    patientName,
    doctorName,
    doctorSpeciality,
    date,
    time,
    appointmentType,
    appointmentId
  } = appointment;

  const formattedDate = new Date(date).toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  });

  let mjmlTemplate = `
    <mjml>
      <mj-head>
        <mj-title>Prescripto - Appointment Confirmation</mj-title>
        <mj-font name="TikTok Sans" href="https://fonts.googleapis.com/css2?family=TikTok+Sans:opsz,wght@12..36,300..900&display=swap" />
        <mj-attributes>
          <mj-all font-family="'TikTok Sans', Arial, sans-serif" />
          <mj-text font-weight="400" font-size="16px" color="#000000" line-height="24px" />
          <mj-section padding="0px" />
        </mj-attributes>
      </mj-head>
      <mj-body background-color="#f4f4f4">
        <mj-section padding="20px 0">
          <mj-column>
            <mj-image width="180px" src="https://raw.githubusercontent.com/user/repo/main/prescripto-logo.png" alt="Prescripto Logo" align="center" />
          </mj-column>
        </mj-section>
        
        <mj-section background-color="#ffffff" border-radius="8px" padding="20px">
          <mj-column>
            <mj-text font-size="24px" color="#4a90e2" font-weight="700" align="center" padding-bottom="10px">
              Appointment Confirmation
            </mj-text>
            
            <mj-text align="center" padding-bottom="20px">
              Your appointment has been successfully scheduled.
            </mj-text>
            
            <mj-section border="1px solid #e0e0e0" border-radius="8px" padding="15px">
              <mj-column>
                <mj-text font-weight="700" padding-bottom="5px">
                  Appointment Details:
                </mj-text>
                
                <mj-text padding="2px 0">
                  <strong>Patient Name:</strong> ${patientName}
                </mj-text>
                
                <mj-text padding="2px 0">
                  <strong>Doctor Name:</strong> Dr. ${doctorName}
                </mj-text>
                
                <mj-text padding="2px 0">
                  <strong>Specialty:</strong> ${doctorSpeciality}
                </mj-text>
                
                <mj-text padding="2px 0">
                  <strong>Date:</strong> ${formattedDate}
                </mj-text>
                
                <mj-text padding="2px 0">
                  <strong>Time:</strong> ${time}
                </mj-text>
                
                <mj-text padding="2px 0">
                  <strong>Type:</strong> ${appointmentType}
                </mj-text>
                
                <mj-text padding="2px 0">
                  <strong>Appointment ID:</strong> ${appointmentId}
                </mj-text>
              </mj-column>
            </mj-section>
            
            <mj-text align="center" padding-top="20px">
              Please arrive 15 minutes before your scheduled appointment time.
            </mj-text>
            
            <mj-button background-color="#5F6FFF" color="white" border-radius="4px" font-weight="700" padding-top="20px" href="https://prescriptocare.vercel.app/my-appointments">
              Manage Your Appointment
            </mj-button>
            
            <mj-divider border-width="1px" border-color="#e0e0e0" padding="20px 0" />
            
            <mj-text align="center" font-size="14px" color="#666666">
              Thank you for choosing Prescripto for your healthcare needs.
            </mj-text>
          </mj-column>
        </mj-section>
        
        <mj-section padding="20px 0">
          <mj-column>
            <mj-text align="center" font-size="12px" color="#666666">
              © ${new Date().getFullYear()} Prescripto. All rights reserved.
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  `;

  // Embed the logo in the template
  mjmlTemplate = embedLogoInTemplate(mjmlTemplate);

  // Compile the MJML to HTML
  const { html } = mjml2html(mjmlTemplate);
  return html;
};

/**
 * Generates a welcome email template using MJML
 * @param {Object} user - The user details
 * @returns {string} - The compiled HTML from the MJML template
 */
export const generateWelcomeEmailTemplate = (user) => {
  const { name } = user;

  let mjmlTemplate = `
    <mjml>
      <mj-head>
        <mj-title>Welcome to Prescripto</mj-title>
        <mj-font name="TikTok Sans" href="https://fonts.googleapis.com/css2?family=TikTok+Sans:opsz,wght@12..36,300..900&display=swap" />
        <mj-attributes>
          <mj-all font-family="'TikTok Sans', Arial, sans-serif" />
          <mj-text font-weight="400" font-size="16px" color="#000000" line-height="24px" />
          <mj-section padding="0px" />
        </mj-attributes>
      </mj-head>
      <mj-body background-color="#f4f4f4">
        <mj-section padding="20px 0">
          <mj-column>
            <mj-image width="180px" src="https://raw.githubusercontent.com/user/repo/main/prescripto-logo.png" alt="Prescripto Logo" align="center" />
          </mj-column>
        </mj-section>
        
        <mj-section background-color="#ffffff" border-radius="8px" padding="20px">
          <mj-column>
            <mj-text font-size="24px" color="#4a90e2" font-weight="700" align="center" padding-bottom="10px">
              Welcome to Prescripto!
            </mj-text>
            
            <mj-text align="center" padding-bottom="20px">
              Hi ${name}, thank you for joining Prescripto. We're excited to have you on board!
            </mj-text>
            
            <mj-text align="left" padding-bottom="15px">
              With Prescripto, you can:
            </mj-text>
            
            <mj-text align="left" padding-left="15px">
              • Book appointments with top doctors<br>
              • Manage your medical records securely<br>
              • Get prescriptions online<br>
              • Access healthcare services 24/7
            </mj-text>
            
            <mj-button background-color="#5F6FFF" color="white" border-radius="4px" font-weight="700" padding-top="20px" href="https://prescriptocare.vercel.app/login">
              Get Started
            </mj-button>
            
            <mj-divider border-width="1px" border-color="#e0e0e0" padding="20px 0" />
            
            <mj-text align="center" font-size="14px" color="#666666">
              If you have any questions or need assistance, please contact our support team.
            </mj-text>
          </mj-column>
        </mj-section>
        
        <mj-section padding="20px 0">
          <mj-column>
            <mj-text align="center" font-size="12px" color="#666666">
              © ${new Date().getFullYear()} Prescripto. All rights reserved.
            </mj-text>
          </mj-column>
        </mj-section>
      </mj-body>
    </mjml>
  `;

  // Embed the logo in the template
  mjmlTemplate = embedLogoInTemplate(mjmlTemplate);

  // Compile the MJML to HTML
  const { html } = mjml2html(mjmlTemplate);
  return html;
};

export default {
  generateOTPEmailTemplate,
  generateAppointmentEmailTemplate,
  generateWelcomeEmailTemplate
}; 