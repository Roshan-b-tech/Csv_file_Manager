import nodemailer from 'nodemailer';

// Validate required environment variables
const requiredEnvVars = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_SECURE',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'SMTP_FROM'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('Missing required SMTP environment variables:', missingEnvVars);
} else {
  console.log('All SMTP environment variables are present');
}

// Create a transporter using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  debug: true, // Enable debug logging
  logger: true // Enable logger
});

// Verify SMTP connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.error('SMTP configuration error:', error);
    console.error('SMTP Config:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE,
      user: process.env.SMTP_USER,
      from: process.env.SMTP_FROM
    });
  } else {
    console.log('SMTP server is ready to take our messages');
  }
});

// Email templates
const templates = {
  csvImportNotification: (fileName: string, rowCount: number) => ({
    subject: 'CSV Import Complete',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">CSV Import Complete</h2>
        <p>Your CSV file has been successfully imported:</p>
        <ul style="list-style: none; padding: 0;">
          <li style="margin: 10px 0;"><strong>File Name:</strong> ${fileName}</li>
          <li style="margin: 10px 0;"><strong>Number of Rows:</strong> ${rowCount}</li>
        </ul>
        <p>You can view and manage your imported data in the CSV Manager section.</p>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 0.875rem;">This is an automated message. Please do not reply.</p>
        </div>
      </div>
    `,
  }),
  productUpdate: (updateTitle: string, updateContent: string) => ({
    subject: 'Product Update: ' + updateTitle,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Product Update</h2>
        <h3 style="color: #1e40af;">${updateTitle}</h3>
        <div style="margin: 20px 0;">
          ${updateContent}
        </div>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 0.875rem;">This is an automated message. Please do not reply.</p>
        </div>
      </div>
    `,
  }),
};

// Email sending functions
export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    if (!process.env.SMTP_FROM) {
      throw new Error('SMTP_FROM environment variable is not set');
    }

    console.log('Attempting to send email:', {
      to,
      subject,
      smtpConfig: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE,
        user: process.env.SMTP_USER ? '***' : undefined,
        from: process.env.SMTP_FROM
      }
    });

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    };

    console.log('Mail options:', { ...mailOptions, html: '...' });

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected
    });
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    throw error;
  }
};

export const sendCsvImportNotification = async (to: string, fileName: string, rowCount: number) => {
  const { subject, html } = templates.csvImportNotification(fileName, rowCount);
  return sendEmail(to, subject, html);
};

export const sendProductUpdate = async (to: string, updateTitle: string, updateContent: string) => {
  const { subject, html } = templates.productUpdate(updateTitle, updateContent);
  return sendEmail(to, subject, html);
};

export const sendInvitationEmail = async (to: string, invitationLink: string) => {
  const subject = 'You are invited to join the CSV Manager team!';
  const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Invitation to CSV Manager</h2>
            <p>You have been invited to join the CSV Manager team.</p>
            <p>Click the link below to register and get started:</p>
            <p style="margin-top: 20px;"><a href="${invitationLink}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px;">Accept Invitation and Register</a></p>
            <p style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <small style="color: #6b7280; font-size: 0.875rem;">This invitation link will expire soon.</small>
            </p>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 0.875rem;">This is an automated message. Please do not reply.</p>
            </div>
        </div>
    `;
  return sendEmail(to, subject, html);
}; 