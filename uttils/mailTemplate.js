const container = (title, content) => `
  <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; max-width: 600px; margin: auto; background-color: #f9f9f9">
    <h2 style="color: #1e3a8a;">${title}</h2>
    <p style="font-size: 15px; color: #333; line-height: 1.6">${content}</p>
    <p style="margin-top: 30px; font-size: 14px; color: #555;">Warm regards,<br/>Delta State And Dental Health Journal Team</p>
  </div>
`;

const submission = {
  subject: "Thank You for Submitting Your Manuscript",
  html: (name, manuscript) =>
    container(
      "Submission Received",
      `Dear ${name},<br/><br/>
    We are pleased to inform you that your manuscript titled <strong>"${manuscript}"</strong> has been successfully submitted for review. Our editorial board will assess it shortly, and you will receive updates as the review process progresses.<br/><br/>
    Thank you for choosing Delta State And Dental Health Journal to publish your work.`
    ),
};

const statusUpdates = {
  "under-review": {
    subject: "Your Manuscript is Now Under Review",
    text: (name, manuscript) =>
      `Dear ${name}, your manuscript "${manuscript}" is currently being reviewed by our editorial board. You will be notified when a decision is made.`,
  },
  accepted: {
    subject: "Your Manuscript Has Been Accepted",
    html: (name, manuscript, manuscriptId) => `

      <h2 style="color: #1e3a8a;">🎉 Congratulations ${name}!</h2>
      <p>Your manuscript titled <strong>"${manuscript}"</strong> has been accepted for publication in our journal.</p>
      <p>To proceed, please complete the publication fee payment.</p>
      <div style="margin: 24px 0;">
        <a href="${process.env.FRONTEND_URL}/pay/${manuscriptId}" style="display: inline-block; padding: 12px 24px; background-color: #1e3a8a; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Pay Now
        </a>
      </div>
      <p>If you have any questions or concerns, feel free to reach out to us.</p>
      <p style="margin-top: 32px;">Best regards,<br><strong>The Editorial Team</strong></p>
  `,
  },
  rejected: {
    subject: "Decision on Your Manuscript Submission",
    text: (name, manuscript) =>
      `Dear ${name}, after thorough review, we regret to inform you that your manuscript "${manuscript}" was not accepted. We encourage you to consider submitting future work.`,
  },
  paid: {
    subject: "Payment Confirmed for Your Manuscript",
    text: (name, manuscript) =>
      `Dear ${name}, your payment for the manuscript "${manuscript}" has been successfully received. Thank you for completing this step, we'll notify you once your manuscript is published.`,
  },
};

const getStatusUpdateTemplate = (name, manuscript, status, manuscriptId) => {
  const entry = statusUpdates[status];
  const text = entry?.text?.(name, manuscript) || undefined;

  return {
    subject: entry?.subject || `Update on Your Manuscript Status`,
    html: container(
      "Manuscript Update",
      entry?.text(name, manuscript, manuscriptId) ||
        `Dear ${name}, there has been an update to your manuscript titled "${manuscript}".`
    ),
    text,
  };
};

const getMessageTemplate = (name, manuscript, message) => {
  return {
    subject: `Message Regarding Your Manuscript`,
    html: container(
      "Editor's Message",
      `Dear ${name},<br/><br/>
      This is a message regarding your manuscript titled <strong>"${manuscript}"</strong>.<br/><br/>
      ${message}`
    ),
  };
};

const getPublishTemplate = (name, manuscript, volume, issue) => {
  return {
    subject: `Your Manuscript Has Been Published`,
    html: container(
      "Manuscript Published",
      `Dear ${name},<br/><br/>
      We are excited to announce that your manuscript titled <strong>"${manuscript}"</strong> has been officially published in our Journal</strong>, Volume ${volume}, Issue ${issue}.<br/><br/>
      It is now accessible to our global readership. Congratulations!, check out our currentIssue <a href="${process.env.FRONTEND_URL}/issue">here</a>`
    ),
  };
};

module.exports = {
  submission,
  getStatusUpdateTemplate,
  getMessageTemplate,
  getPublishTemplate,
};
