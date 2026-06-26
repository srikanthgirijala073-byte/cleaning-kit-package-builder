require('dotenv').config();

async function verifyRecaptcha(req, res, next) {
  const secretKey = process.env.RECAPTCHA_SECRET;

  if (!secretKey || secretKey === 'your_recaptcha_secret') {
    return next();
  }

  const recaptchaToken = req.body.recaptchaToken;

  if (!recaptchaToken) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(400).json({ message: 'reCAPTCHA verification token is required.' });
    }
    return next();
  }

  try {
    const response = await fetch(
      'https://www.google.com/recaptcha/api/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: secretKey,
          response: recaptchaToken
        })
      }
    );

    const data = await response.json();
    const threshold = parseFloat(process.env.RECAPTCHA_THRESHOLD || '0.5');

    if (!data.success || data.score < threshold) {
      console.warn('reCAPTCHA failed:', 'success=' + data.success, 'score=' + data.score);
      return res.status(403).json({
        message: 'Security verification failed. Please try again.',
        recaptchaFailed: true
      });
    }

    next();
  } catch (error) {
    console.error('reCAPTCHA error:', error.message);
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({ message: 'Security service unavailable. Please try again later.' });
    }
    next();
  }
}

module.exports = { verifyRecaptcha };
