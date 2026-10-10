import { siteConfig } from "../../lib/config";

export default function Contact() {
  return <main className="section legal">
    <a href="/" className="eyebrow">← USDT DESK</a>
    <h1>Contact Bharat OTC</h1>
    <p>To start a sell flow, contact the operator and confirm the payout method, amount, current rate and receiving wallet before sending USDT.</p>
    <p><a className="button button-gold" href={siteConfig.whatsapp} target="_blank" rel="noopener noreferrer">Sell USDT on WhatsApp</a></p>
    <p><a className="button button-outline" href={siteConfig.telegram} target="_blank" rel="noopener noreferrer">Sell USDT on Telegram</a></p>
  </main>;
}
