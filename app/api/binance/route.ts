import { NextResponse } from "next/server";

const binanceTickerEndpoint = "https://api.binance.com/api/v3/ticker/price?symbol=USDTUSDC";
export const dynamic = "force-dynamic";

type BinanceTicker = { symbol?: string; price?: string };

function isBinanceTicker(value: unknown): value is BinanceTicker {
  return typeof value === "object" && value !== null && "price" in value;
}

export async function GET() {
  try {
    const response = await fetch(binanceTickerEndpoint, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
      headers: { accept: "application/json", "user-agent": "Mozilla/5.0 (compatible; BharatOTC/1.0)" }
    });
    if (!response.ok) {
      return NextResponse.json({ status: "unavailable", message: "Binance spot price is unavailable." }, { status: 502 });
    }

    const data: unknown = await response.json();
    const price = isBinanceTicker(data) ? Number(data.price) : NaN;
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ status: "unavailable", message: "Binance returned an invalid USDT price." }, { status: 502 });
    }

    return NextResponse.json({
      status: "live",
      source: "Binance Spot",
      market: "USDT/USDC",
      price,
      timestamp: Date.now()
    });
  } catch {
    return NextResponse.json({ status: "unavailable", message: "Binance spot price could not be reached." }, { status: 502 });
  }
}
