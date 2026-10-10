export const siteConfig = {
  name: "USDT",
  whatsapp: "https://wa.me/9779716565504",
  telegram: "https://t.me/Usdtbuyerus",
  telegramHandle: "@Usdtbuyerus",
  operatorWallet: "0xA0a90E9d255EA98716C809Cd9980246D8b2B2A70",
  chainId: 56,
  networkName: "BNB Smart Chain",
  networkStandard: "BEP-20",
  usdtContract: "0x55d398326f99059fF775485246999027B3197955"
} as const;

export const payoutRates = {
  upi: 110,
  imps: 112,
  bankTransfer: 115,
  cdm: 118
} as const;

export type PayoutMethod = keyof typeof payoutRates;
export const payoutLabels: Record<PayoutMethod, string> = {
  upi: "UPI",
  imps: "IMPS",
  bankTransfer: "Bank Transfer",
  cdm: "CDM"
};
