const Lead = require('../models/Lead');

// Lightweight email validator — good enough to reject obvious junk without
// pulling in a dependency. Real verification is delivery-based (out of scope).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.createLead = async (req, res) => {
  try {
    const fullName = String(req.body?.fullName || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const company = String(req.body?.company || '').trim();
    const phone = String(req.body?.phone || '').trim();
    const location = String(req.body?.location || '').trim();

    if (!fullName) return res.status(400).json({ error: 'Full name is required' });
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'A valid work email is required' });
    }

    // Cap field lengths so a malicious client can't flood the DB.
    const lead = await Lead.create({
      fullName: fullName.slice(0, 120),
      company: company.slice(0, 120),
      email: email.slice(0, 200),
      phone: phone.slice(0, 50),
      location: location.slice(0, 200),
      source: 'landing',
      userAgent: String(req.get('user-agent') || '').slice(0, 500),
      ip: String(req.ip || '').slice(0, 80),
    });

    res.status(201).json({
      message: 'Thanks! We will be in touch shortly.',
      leadId: lead._id,
    });
  } catch (err) {
    console.error('createLead error:', err);
    res.status(500).json({ error: 'Failed to submit. Please try again.' });
  }
};
