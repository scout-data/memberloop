const NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

export function whatsappUrl(text = "Hi! I'd like to learn more about memberloop.") {
  const encoded = encodeURIComponent(text);
  return `https://wa.me/${NUMBER}?text=${encoded}`;
}
