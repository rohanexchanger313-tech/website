"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { payoutLabels, payoutRates, siteConfig, type PayoutMethod } from "../lib/config";
import { formatUsdt, inr } from "../lib/formatting";

const sampleAmounts = [100, 250, 500, 1000, 2500];
const navItems = [["Market", "market"], ["How It Works", "how-it-works"], ["FAQ", "faq"], ["Contact", "contact"]];

function ContactLinks({ className = "" }: { className?: string }) {
  return <div className={`contact-links ${className}`}>
    <a className="button button-gold" href={siteConfig.whatsapp} target="_blank" rel="noopener noreferrer">Sell USDT on WhatsApp</a>
    <a className="button button-outline" href={siteConfig.telegram} target="_blank" rel="noopener noreferrer">Sell USDT on Telegram</a>
  </div>;
}

export default function DeskApp() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [method, setMethod] = useState<PayoutMethod>("upi");
  const [amount, setAmount] = useState("100");
  const [sampleIndex, setSampleIndex] = useState(0);
  const [market, setMarket] = useState<{ status: string; price?: number; timestamp?: number; offers?: number; message?: string }>({ status: "loading" });
  const [observations, setObservations] = useState<{ time: number; price: number }[]>([]);
  const [hash, setHash] = useState("");
  const [verification, setVerification] = useState("");

  const numericAmount = Math.max(0, Number(amount) || 0);
  const estimate = numericAmount * payoutRates[method];
  const samplePayout = sampleAmounts[sampleIndex] * payoutRates[method];

  useEffect(() => {
    const timer = window.setInterval(() => setSampleIndex((index) => (index + 1) % sampleAmounts.length), 3500);
    return () => window.clearInterval(timer);
  }, []);
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
    <section id="home" className="hero section"><div className="hero-copy"><p className="eyebrow">USDT OTC · INDIA</p><h1>Sell USDT.<br /><em>Get INR.</em></h1><p className="lede">Check our current USDT payout rates and contact us to sell your USDT for INR.</p><ContactLinks /><p className="disclaimer">Manual settlement · Blockchain transaction verification · You remain in control of your wallet</p></div>
      <div className="sample-card"><span className="eyebrow">Sample Payout</span><p className="sample-amount">{formatUsdt(sampleAmounts[sampleIndex])} <small>USDT</small></p><p className="sample-inr">{inr.format(samplePayout)}</p><p className="muted">Illustration based on our current payout rate</p></div>
    </section>
    <section id="sell" className="section calculator-section"><div><p className="eyebrow">START A SELL FLOW</p><h2>Estimate your payout</h2><p className="muted">Choose how you would like to receive INR. Final payout is confirmed with the operator before the transaction.</p></div>
      <div className="calculator"><label htmlFor="amount">You sell (USDT)</label><input id="amount" inputMode="decimal" min="0" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} /><div className="method-grid" role="tablist" aria-label="Payout method">{(Object.keys(payoutRates) as PayoutMethod[]).map((key) => <button key={key} role="tab" aria-selected={method === key} className={method === key ? "method active" : "method"} onClick={() => setMethod(key)}>{payoutLabels[key]}<strong>{inr.format(payoutRates[key])}<small> / USDT</small></strong></button>)}</div><div className="estimate"><span>Estimated Payout</span><strong>{inr.format(estimate)}</strong><small>{formatUsdt(numericAmount)} USDT × {inr.format(payoutRates[method])}</small></div><ContactLinks /></div>
    </section>
    <section id="market" className="section dark-section"><div className="section-heading"><p className="eyebrow">MARKET REFERENCE</p><h2>Live Binance USDT price</h2><p className="muted">Direct Binance spot reference for USDT/USDC. This is a market reference, not our INR payout rate.</p></div><div className="market-panel"><div><span className={`status ${market.status}`}>{market.status === "loading" ? "UPDATING" : market.status === "live" ? "LIVE" : "UNAVAILABLE"}</span>{market.price ? <><p className="market-price">${market.price.toFixed(6)} <small>/ USDT</small></p><p className="muted">Binance Spot · Last observation {market.timestamp ? new Date(market.timestamp).toLocaleTimeString("en-IN") : ""}</p></> : <><p className="market-message">{market.message || "Collecting live Binance USDT price..."}</p><button className="button button-outline" onClick={() => void updateMarket()}>Retry Binance price</button></>}</div><div className="chart" aria-label="Live Binance USDT spot price chart">{observations.length > 1 ? <svg viewBox="0 0 190 90" preserveAspectRatio="none" role="img"><polyline points={path} fill="none" stroke="currentColor" strokeWidth="2" /></svg> : <span>Collecting live observations...</span>}</div></div></section>
    <section id="how-it-works" className="section"><p className="eyebrow">THE SELL FLOW</p><h2>Clear from start to finish</h2><div className="steps">{["Choose a payout method and amount", "Confirm the current rate with the operator", "Send USDT on BNB Smart Chain (BEP-20)", "Share your transaction hash for verification", "Operator manually settles INR"].map((text, index) => <div className="step" key={text}><span>0{index + 1}</span><p>{text}</p></div>)}</div><div className="wallet-card"><div><p className="eyebrow">RECEIVING WALLET</p><h3>Trust Wallet · USDT · BEP-20</h3></div><Image className="qr" src="/usdt-bep20-qr.png" width={150} height={150} alt="QR code for the USDT BNB Smart Chain receiving wallet" /><p className="warning">Send USDT only on BNB Smart Chain (BEP-20). Sending through another network may result in loss of funds. Always confirm the wallet address and network before sending.</p></div></section>
    <section className="section verify"><p className="eyebrow">TRANSACTION CHECK</p><h2>Verify a specific transfer</h2><p className="muted">Enter the hash after sending. Verification checks the BNB Smart Chain receipt, USDT contract, recipient, amount and confirmations.</p><div className="verify-form"><label htmlFor="hash">Transaction hash</label><input id="hash" value={hash} onChange={(event) => setHash(event.target.value)} placeholder="0x..." /><button className="button button-gold" onClick={verifyTransaction}>Verify transaction</button></div>{verification && <p className="muted" role="status">{verification}</p>}</section>
    <section id="faq" className="section faq"><p className="eyebrow">FAQ</p><h2>Important details</h2>{[["Do you sell USDT?", "No. USDT Desk is a sell-USDT-only OTC service. You send USDT and the operator manually settles INR separately."], ["Is the payout automatic?", "No. The estimate is informational. The operator confirms the rate and payout details before you send USDT, then manually settles INR after verification."], ["Which network should I use?", "Use BNB Smart Chain (BEP-20) only. Check the wallet address and network in your wallet before confirming a transfer."], ["What is verified?", "A specific transaction hash can be checked for the correct network, token contract, recipient, amount, success status and confirmations."]].map(([question, answer]) => <details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</section>
    <footer id="contact" className="footer"><div><a className="brand" href="#home"><span className="brand-mark">₮</span><span>USDT</span></a><p className="muted">SELL USDT → RECEIVE INR</p></div><div><a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="/risk-disclosure">Risk disclosure</a></div></footer>
  </main>;
}
