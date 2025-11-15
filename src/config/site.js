export const SITE = {
  name: 'WolfTactical',
  supportEmail: 'iifeeedtactical@gmail.com',
  phones: {
    sebastian: '56959572663',
  },
  social: {
    facebook: 'https://www.facebook.com/your-page',
    twitter: 'https://www.twitter.com/your-page',
    instagram: 'https://www.instagram.com/your-page',
  },
};

export function formatPhoneE164(num) {
  // Expects numbers like '56959572663' and returns '+56 9 59572663'
  if (!num) return '';
  if (!/^\d+$/.test(num)) return `+${num}`;
  if (num.startsWith('56')) {
    const rest = num.slice(2);
    if (rest.length === 9 && rest.startsWith('9')) {
      return `+56 9 ${rest.slice(1)}`;
    }
    return `+56 ${rest}`;
  }
  return `+${num}`;
}
