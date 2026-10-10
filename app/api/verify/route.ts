import { NextResponse } from "next/server";
import { Contract, JsonRpcProvider, isHexString, parseUnits } from "ethers";
import { siteConfig } from "../../../lib/config";

const transferTopic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const abi = ["function decimals() view returns (uint8)"];

export async function POST(request: Request) {
  const rpcUrl = process.env.BSC_RPC_URL;
  if (!rpcUrl) return NextResponse.json({ status: "unavailable", message: "Blockchain verification is not configured." }, { status: 503 });
  const body = await request.json().catch(() => null);
  const hash = body && typeof body.hash === "string" ? body.hash.trim() : "";
  const amount = body && typeof body.amount === "string" ? body.amount.trim() : "";
  if (!isHexString(hash, 32) || !/^\d+(\.\d{1,6})?$/.test(amount)) return NextResponse.json({ status: "invalid", message: "Enter a valid transaction hash and USDT amount." }, { status: 400 });
  try {
    const provider = new JsonRpcProvider(rpcUrl, siteConfig.chainId);
    const transaction = await provider.getTransaction(hash);
    const receipt = await provider.getTransactionReceipt(hash);
    if (!transaction || !receipt) return NextResponse.json({ status: "not_found", message: "Transaction not found on BNB Smart Chain." }, { status: 404 });
    if (receipt.status !== 1) return NextResponse.json({ status: "failed", message: "The transaction did not succeed." }, { status: 422 });
    const token = new Contract(siteConfig.usdtContract, abi, provider);
    const decimals = Number(await token.decimals());
    const expected = parseUnits(amount, decimals);
    const recipientTopic = `0x${siteConfig.operatorWallet.slice(2).toLowerCase().padStart(64, "0")}`;
    const transfer = receipt.logs.find((log) => log.address.toLowerCase() === siteConfig.usdtContract.toLowerCase() && log.topics[0] === transferTopic && log.topics[2]?.toLowerCase() === recipientTopic);
    if (!transfer || !transfer.topics[1] || BigInt(transfer.data) !== expected) return NextResponse.json({ status: "mismatch", message: "No matching USDT transfer to the receiving wallet was found." }, { status: 422 });
    const latest = await provider.getBlockNumber();
    const confirmations = latest - receipt.blockNumber + 1;
    return NextResponse.json({ status: confirmations >= 3 ? "verified" : "pending", confirmations, required: 3, network: siteConfig.networkName, token: siteConfig.usdtContract });
  } catch {
    return NextResponse.json({ status: "unavailable", message: "The blockchain RPC could not verify this transaction." }, { status: 502 });
  }
}
