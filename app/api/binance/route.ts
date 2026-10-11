import { NextResponse } from "next/server";

const binanceTickerEndpoints = [
  "https://data-api.binance.vision/api/v3/ticker/price?symbol=USDCUSDT",
  "https://api.binance.com/api/v3/ticker/price?symbol=USDCUSDT"
] as const;
export const dynamic = "force-dynamic";

type BinanceTicker = { symbol?: string; price?: string };

function isBinanceTicker(value: unknown): value is BinanceTicker {
  return typeof value === "object" && value !== null && "symbol" in value && value.symbol === "USDCUSDT" && "price" in value;
}

async function fetchLivePrice(): Promise<number | null> {
  for (const endpoint of binanceTickerEndpoints) {
    try {
      const response = await fetch(endpoint, {
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
        headers: { accept: "application/json", "user-agent": "Mozilla/5.0 (compatible; USDT/1.0)" }
      });
      if (!response.ok) continue;

      const data: unknown = await response.json();
      const inversePairPrice = isBinanceTicker(data) ? Number(data.price) : NaN;
      if (Number.isFinite(inversePairPrice) && inversePairPrice > 0) return 1 / inversePairPrice;
    } catch {
      continue;
    }
  }
  return null;
}

export async function GET() {
  const price = await fetchLivePrice();
  if (price === null) {
    return NextResponse.json({ status: "unavailable", message: "Binance spot price is temporarily unavailable." }, { status: 502 });
  }

  return NextResponse.json({
    status: "live",
    source: "Binance Spot",
    market: "USDT/USDC",
    price,
    timestamp: Date.now()
  });
}
