"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { payoutLabels, payoutRates, siteConfig, type PayoutMethod } from "../lib/config";
import { formatUsdt, inr } from "../lib/formatting";

const navItems = [["Market", "market"], ["How It Works", "how-it-works"], ["FAQ", "faq"], ["Contact", "contact"]];
const paymentMarks: Record<PayoutMethod, string> = { upi: "UPI", imps: "IMPS", bankTransfer: "BANK", cdm: "CDM" };

function ContactLinks({ className = "" }: { className?: string }) {
  return <div className={`contact-links ${className}`}>
    <a className="button button-gold" href={siteConfig.whatsapp} target="_blank" rel="noopener noreferrer">Sell USDT on WhatsApp</a>
    <a className="button button-outline" href={siteConfig.telegram} target="_blank" rel="noopener noreferrer">Sell USDT on Telegram</a>
  </div>;
}

type PaymentField = {
  id: string;
  label: string;
  placeholder?: string;
  kind?: "bank";
};

const banks = ["SBI", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank", "Other"];
const paymentFields: Record<PayoutMethod, PaymentField[]> = {
  upi: [{ id: "upiId", label: "UPI ID", placeholder: "Enter UPI ID" }],
  imps: [
    { id: "bankName", label: "Bank name", kind: "bank" },
    { id: "accountNumber", label: "Account number", placeholder: "Enter account number" },
    { id: "ifsc", label: "IFSC code", placeholder: "Enter IFSC code" },
    { id: "accountHolder", label: "Account holder name", placeholder: "Enter account holder name" }
  ],
  bankTransfer: [
    { id: "bankName", label: "Bank name", kind: "bank" },
    { id: "accountNumber", label: "Account number", placeholder: "Enter account number" },
    { id: "ifsc", label: "IFSC code", placeholder: "Enter IFSC code" },
    { id: "accountHolder", label: "Account holder name", placeholder: "Enter account holder name" }
  ],
  cdm: [
    { id: "bankName", label: "Bank name", kind: "bank" },
    { id: "cdmLocation", label: "CDM location", placeholder: "Enter CDM location" },
    { id: "transactionReference", label: "Transaction ID / reference", placeholder: "Enter reference" }
  ]
};

function PaymentCard({ method, onStartSell }: { method: PayoutMethod; onStartSell: (amount: string) => void }) {
  const [amount, setAmount] = useState("100");
  const [details, setDetails] = useState<Record<string, string>>({});
  const numericAmount = Math.max(0, Number(amount) || 0);
  const payout = numericAmount * payoutRates[method];

  const submitPayment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onStartSell(amount);
    const detailLines = paymentFields[method]
      .map(({ id, label }) => details[id] ? `${label}: ${details[id]}` : "")
      .filter(Boolean);
    const whatsappUrl = new URL(siteConfig.whatsapp);
    whatsappUrl.searchParams.set("text", [
      `Hi, I want to sell ${amount} USDT using ${payoutLabels[method]}.`,
      `Estimated payout: ${inr.format(payout)} INR.`,
      ...detailLines
    ].join("\n"));
    window.open(whatsappUrl.toString(), "_blank", "noopener,noreferrer");
  };

  return <article className={`payment-card payment-card-${method}`}>
    <header className="payment-card-header">
      <span className="payment-card-mark" aria-hidden="true">{method === "upi" ? "UPI" : method === "cdm" ? "₹" : "▤"}</span>
      <div><h3>{payoutLabels[method]}</h3><p className="payment-card-rate"><span>Rate</span><strong>{inr.format(payoutRates[method])}</strong><small>/ USDT</small></p></div>
    </header>
    <form className="payment-card-form" onSubmit={submitPayment}>
      <div className="payment-card-fields">{paymentFields[method].map((field) => <label className="payment-card-field" htmlFor={`${method}-${field.id}`} key={field.id}>
        <span>{field.label}</span>
        {field.kind === "bank" ? <select id={`${method}-${field.id}`} value={details[field.id] || ""} onChange={(event) => setDetails((current) => ({ ...current, [field.id]: event.target.value }))} required>
          <option value="" disabled>Select bank</option>{banks.map((bank) => <option key={bank}>{bank}</option>)}
        </select> : <input id={`${method}-${field.id}`} type="text" value={details[field.id] || ""} onChange={(event) => setDetails((current) => ({ ...current, [field.id]: event.target.value }))} placeholder={field.placeholder} required />}
      </label>)}</div>
      <label className="payment-card-field" htmlFor={`${method}-amount`}><span>USDT amount</span><input id={`${method}-amount`} type="number" min="0.000001" step="any" value={amount} onChange={(event) => setAmount(event.target.value)} required /></label>
      <output className="payment-card-estimate"><span>You will get (INR)</span><strong>{inr.format(payout)}</strong></output>
      <button className="payment-submit button button-gold" type="submit">Sell USDT ({payoutLabels[method]})</button>
    </form>
  </article>;
}

export default function DeskApp() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [amount, setAmount] = useState("100");
  const [market, setMarket] = useState<{ status: string; price?: number; timestamp?: number; offers?: number; message?: string }>({ status: "loading" });
  const [observations, setObservations] = useState<{ time: number; price: number }[]>([]);
  const [hash, setHash] = useState("");
  const [verification, setVerification] = useState("");

  const updateMarket = async () => {
    try {
      const response = await fetch("/api/binance", { cache: "no-store" });
      const data = await response.json();
      setMarket(data);
      if (data.status === "live" && typeof data.price === "number") {
        setObservations((items) => [...items.slice(-19), { time: data.timestamp, price: data.price }]);
      }
    } catch {
      setMarket({ status: "unavailable", message: "Binance P2P market data could not be reached." });
    }
  };
  useEffect(() => {
    let active = true;
    void updateMarket();
    const timer = window.setInterval(() => { if (active) void updateMarket(); }, 15000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  const path = useMemo(() => observations.map((point, index) => `${index * 10},${80 - ((point.price - Math.min(...observations.map((x) => x.price), point.price)) / Math.max(0.01, Math.max(...observations.map((x) => x.price), point.price) - Math.min(...observations.map((x) => x.price), point.price))) * 65}`).join(" "), [observations]);
  const verifyTransaction = async () => {
    setVerification("Checking this transaction...");
    const response = await fetch("/api/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ hash, amount }) });
    const data = await response.json();
    setVerification(data.message || (data.status === "verified" ? `Verified with ${data.confirmations} confirmations.` : `Status: ${data.status}.`));
  };

  return <main>
    <nav className="navbar" aria-label="Primary navigation"><a className="brand" href="#home"><span className="brand-mark">₮</span><span>USDT</span></a>
      <button className="menu-button" aria-expanded={menuOpen} aria-controls="nav-links" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? "Close" : "Menu"}</button>
      <div id="nav-links" className={`nav-links ${menuOpen ? "open" : ""}`}>{navItems.map(([label, id]) => <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)}>{label}</a>)}<a className="nav-cta" href="#sell" onClick={() => setMenuOpen(false)}>Sell USDT</a></div>
    </nav>
    <section id="home" className="reference-hero"><div className="reference-hero-inner">
      <div className="reference-hero-copy"><p className="eyebrow">DAILY USDT · INDIA</p><div className="reference-hero-title"><span className="reference-token" aria-hidden="true">₮</span><div><h1>USDT</h1><p>SELL USDT</p></div></div><div className="reference-perks"><span>Fast</span><span>Secure</span><span>Trusted</span></div><p className="reference-motto">Your trust is our priority.</p><p className="muted">Manual INR settlement · BNB Smart Chain only</p><ContactLinks className="reference-hero-actions" /></div>
      <div className="reference-hero-visual" aria-label="Trust Wallet USDT on BNB Smart Chain">
        <div className="reference-rate-badge"><span>Daily USDT</span><strong>Sell</strong><small>Transparent INR rates</small></div>
        <div className="reference-phone"><span className="reference-phone-speaker" /><div className="reference-phone-screen"><span className="reference-wallet-check">✓</span><strong>Trust Wallet</strong><span className="reference-wallet-caption">USDT · BNB Smart Chain</span><span className="reference-phone-token">₮</span><span className="reference-network-tag">BEP-20 ONLY</span></div></div>
        <span className="reference-shield" aria-hidden="true">✓</span>
      </div>
    </div></section>
    <section className="rate-summary section" aria-labelledby="rate-summary-title"><div className="rate-summary-inner"><div className="rate-summary-heading"><div><h2 id="rate-summary-title">USDT SELL RATE</h2><span>Per USDT</span></div><p>Choose your payment method</p></div><div className="rate-summary-grid">{(Object.keys(payoutRates) as PayoutMethod[]).map((method) => <div className={`rate-summary-card rate-summary-${method}`} key={method}><span className="rate-summary-mark">{paymentMarks[method]}</span><span className="rate-summary-name">{payoutLabels[method]}</span><span className="rate-summary-value">{inr.format(payoutRates[method])}</span></div>)}</div></div></section>
    <section id="sell" className="section payment-section"><div className="payment-section-inner"><div className="payment-section-heading"><p className="eyebrow">HOW TO SELL USDT?</p><h2>Choose your payment method</h2><p className="muted">Enter your payment details and USDT amount. Your estimated INR payout updates automatically.</p></div>
      <div className="payment-cards-grid">{(Object.keys(payoutRates) as PayoutMethod[]).map((method) => <PaymentCard key={method} method={method} onStartSell={setAmount} />)}</div></div>
    </section>
    <section className="trust-ribbon" aria-label="Service highlights"><div className="trust-ribbon-inner"><div className="trust-ribbon-item"><span>✓</span><p><strong>Safe transactions</strong><small>Verified on-chain</small></p></div><div className="trust-ribbon-item"><span>↗</span><p><strong>Fast process</strong><small>Clear next steps</small></p></div><div className="trust-ribbon-item"><span>₮</span><p><strong>Trusted settlement</strong><small>Manual INR payout</small></p></div><div className="trust-ribbon-item"><span>₹</span><p><strong>Clear rates</strong><small>Shown before you sell</small></p></div></div></section>
    <section id="market" className="section dark-section"><div className="section-heading"><p className="eyebrow">MARKET REFERENCE</p><h2>Live Binance USDT price</h2><p className="muted">Direct Binance spot reference for USDT/USDC. This is a market reference, not our INR payout rate.</p></div><div className="market-panel"><div><span className={`status ${market.status}`}>{market.status === "loading" ? "UPDATING" : market.status === "live" ? "LIVE" : "UNAVAILABLE"}</span>{market.price ? <><p className="market-price">${market.price.toFixed(6)} <small>/ USDT</small></p><p className="muted">Binance Spot · Last observation {market.timestamp ? new Date(market.timestamp).toLocaleTimeString("en-IN") : ""}</p></> : <><p className="market-message">{market.message || "Collecting live Binance USDT price..."}</p><button className="button button-outline" onClick={() => void updateMarket()}>Retry Binance price</button></>}</div><div className="chart" aria-label="Live Binance USDT spot price chart">{observations.length > 1 ? <svg viewBox="0 0 190 90" preserveAspectRatio="none" role="img"><polyline points={path} fill="none" stroke="currentColor" strokeWidth="2" /></svg> : <span>Collecting live observations...</span>}</div></div></section>
    <section id="how-it-works" className="section"><p className="eyebrow">THE SELL FLOW</p><h2>Clear from start to finish</h2><div className="steps">{["Choose a payout method and amount", "Confirm the current rate with the operator", "Send USDT on BNB Smart Chain (BEP-20)", "Share your transaction hash for verification", "Operator manually settles INR"].map((text, index) => <div className="step" key={text}><span>0{index + 1}</span><p>{text}</p></div>)}</div><div className="wallet-card"><div><p className="eyebrow">RECEIVING WALLET</p><h3>Trust Wallet · USDT · BEP-20</h3></div><Image className="qr" src="/usdt-bep20-qr.png" width={150} height={150} alt="QR code for the USDT BNB Smart Chain receiving wallet" /><p className="warning">Send USDT only on BNB Smart Chain (BEP-20). Sending through another network may result in loss of funds. Always confirm the wallet address and network before sending.</p></div></section>
    <section className="section verify"><p className="eyebrow">TRANSACTION CHECK</p><h2>Verify a specific transfer</h2><p className="muted">Enter the hash after sending. Verification checks the BNB Smart Chain receipt, USDT contract, recipient, amount and confirmations.</p><div className="verify-form"><label htmlFor="hash">Transaction hash</label><input id="hash" value={hash} onChange={(event) => setHash(event.target.value)} placeholder="0x..." /><button className="button button-gold" onClick={verifyTransaction}>Verify transaction</button></div>{verification && <p className="muted" role="status">{verification}</p>}</section>
    <section id="faq" className="section faq"><p className="eyebrow">FAQ</p><h2>Important details</h2>{[["Do you sell USDT?", "No. USDT Desk is a sell-USDT-only OTC service. You send USDT and the operator manually settles INR separately."], ["Is the payout automatic?", "No. The estimate is informational. The operator confirms the rate and payout details before you send USDT, then manually settles INR after verification."], ["Which network should I use?", "Use BNB Smart Chain (BEP-20) only. Check the wallet address and network in your wallet before confirming a transfer."], ["What is verified?", "A specific transaction hash can be checked for the correct network, token contract, recipient, amount, success status and confirmations."]].map(([question, answer]) => <details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</section>
    <footer id="contact" className="footer"><div><a className="brand" href="#home"><span className="brand-mark">₮</span><span>USDT</span></a><p className="muted">SELL USDT → RECEIVE INR</p></div><div><a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="/risk-disclosure">Risk disclosure</a></div></footer>
  </main>;
}
