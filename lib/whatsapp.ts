export function dispatchWhatsAppUrl(phone: string, receipt: string): string | null {
  if (!/^[6-9][0-9]{9}$/.test(phone) || !/^CC-[A-Z0-9-]{3,24}$/.test(receipt)) return null;
  const message = `Hello! Your Campus Crochet order ${receipt} has been dispatched. Thank you for supporting handmade pieces. Please reply here if you need help with delivery.`;
  return `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
}
