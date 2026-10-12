import { siteConfig } from "../../lib/config";

export default function Contact() {
  return <main className="section legal">
    <a href="/" className="eyebrow">← USDT DESK</a>
    <h1>Contact USDT</h1>
    <p>WhatsApp and Telegram are for customer support only. Choose a payout method on the home page to view the estimate and Trust Wallet payment QR code. Confirm all payment details before sending USDT.</p>
    <p><a className="button button-gold" href={siteConfig.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp Support</a></p>
    <p><a className="button button-outline" href={siteConfig.telegram} target="_blank" rel="noopener noreferrer">Telegram Support</a></p>
  </main>;
}
