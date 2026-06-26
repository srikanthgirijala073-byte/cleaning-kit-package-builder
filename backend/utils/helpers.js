function parseUserAgent(uaString = '') {
  const ua = uaString.toLowerCase();
  let browser = 'Unknown Browser';
  let device = 'Desktop';
  let os = 'Unknown OS';

  // Parse OS
  if (ua.includes('windows')) {
    os = 'Windows';
  } else if (ua.includes('macintosh') || ua.includes('mac os')) {
    os = 'macOS';
  } else if (ua.includes('iphone')) {
    os = 'iOS';
    device = 'iPhone';
  } else if (ua.includes('ipad')) {
    os = 'iOS';
    device = 'iPad';
  } else if (ua.includes('android')) {
    os = 'Android';
    device = 'Mobile Device';
  } else if (ua.includes('linux')) {
    os = 'Linux';
  }

  // Parse Browser
  if (ua.includes('edg/')) {
    browser = 'Edge';
  } else if (ua.includes('chrome') && !ua.includes('chromium')) {
    browser = 'Chrome';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari';
  } else if (ua.includes('firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('opr/') || ua.includes('opera')) {
    browser = 'Opera';
  }

  return { browser, device: `${device} (${os})` };
}

async function getLocationFromIp(ip) {
  // Handle local loopbacks
  if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || !ip) {
    return 'Hyderabad, Telangana, India (Local Dev)';
  }
  
  try {
    // Call ip-api (free endpoint, no key required) using Node's native fetch
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city`);
    const data = await response.json();
    if (data && data.status === 'success') {
      const { city, regionName, country } = data;
      return `${city}, ${regionName}, ${country}`;
    }
  } catch (error) {
    console.error('Error fetching location from IP:', error.message);
  }
  
  return 'Unknown Location';
}

module.exports = {
  parseUserAgent,
  getLocationFromIp
};
