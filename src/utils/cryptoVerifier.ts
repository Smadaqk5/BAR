import { CryptoVerifyResult, PaymentMethod, TronVerifyResult } from '../types';
import { verifyTronTransaction, DEFAULT_TRON_DEPOSIT_ADDRESS } from './tronVerifier';

export const DEFAULT_BTC_DEPOSIT_ADDRESS = 
  (import.meta as any).env?.VITE_BTC_DEPOSIT_ADDRESS?.trim() || 'bc1q8c6fshw2dlwun7ekn9qwf37cu2rn755upcp6el';

export const DEFAULT_LTC_DEPOSIT_ADDRESS = 
  (import.meta as any).env?.VITE_LTC_DEPOSIT_ADDRESS?.trim() || 'ltc1qrgp00e57s2y3q43f5h3r8gq3g25k7e68d9w4h5';

/**
 * Validates a 64-character hexadecimal transaction hash
 */
export function isValidTxHash(hash: string): boolean {
  return /^[a-fA-F0-9]{64}$/.test(hash.trim());
}

/**
 * Validates crypto wallet addresses based on currency network
 */
export function isValidCryptoAddress(address: string, currency: 'USDT' | 'BTC' | 'LTC'): boolean {
  const clean = address.trim();
  if (!clean) return false;

  if (currency === 'USDT') {
    return /^T[a-km-zA-HJ-NP-Z1-9]{33}$/.test(clean);
  }
  if (currency === 'BTC') {
    return /^(1[a-km-zA-HJ-NP-Z1-9]{25,34}|3[a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})$/i.test(clean);
  }
  if (currency === 'LTC') {
    return /^(L[a-km-zA-HJ-NP-Z1-9]{26,35}|M[a-km-zA-HJ-NP-Z1-9]{26,35}|3[a-km-zA-HJ-NP-Z1-9]{26,35}|ltc1[a-z0-9]{39,59})$/i.test(clean);
  }
  return false;
}

/**
 * Verifies a Bitcoin (BTC) transaction using Mempool.space and Blockstream APIs
 */
export async function verifyBtcTransaction(
  txHash: string,
  requiredBtcAmount: number,
  expectedToAddress: string = DEFAULT_BTC_DEPOSIT_ADDRESS
): Promise<CryptoVerifyResult> {
  const cleanHash = txHash.trim();

  if (!isValidTxHash(cleanHash)) {
    return {
      valid: false,
      amountReceived: 0,
      currency: 'BTC',
      error: 'Invalid Bitcoin TxID format. A valid hash must be exactly 64 hexadecimal characters.'
    };
  }

  const endpoints = [
    `https://mempool.space/api/tx/${encodeURIComponent(cleanHash)}`,
    `https://blockstream.info/api/tx/${encodeURIComponent(cleanHash)}`
  ];

  let rawData: any = null;
  let fetchError = '';

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        rawData = await response.json();
        if (rawData && rawData.txid) break;
      }
    } catch (err: any) {
      fetchError = err?.message || 'Failed to reach Bitcoin explorer';
    }
  }

  if (!rawData || !rawData.txid) {
    return {
      valid: false,
      amountReceived: 0,
      currency: 'BTC',
      error: 'Bitcoin transaction hash not found on blockchain or mempool. If recently broadcast, please wait 30-60 seconds for network propagation.'
    };
  }

  // Inspect transaction outputs (vout)
  const vouts: any[] = rawData.vout || [];
  const cleanExpectedAddr = expectedToAddress.trim().toLowerCase();

  // Find outputs that match the expected deposit address
  let matchingSatoshis = 0;
  let matchedRecipient = '';

  for (const out of vouts) {
    const outAddr = (out.scriptpubkey_address || '').trim().toLowerCase();
    if (outAddr && outAddr === cleanExpectedAddr) {
      matchingSatoshis += (out.value || 0);
      matchedRecipient = out.scriptpubkey_address;
    }
  }

  if (matchingSatoshis <= 0) {
    return {
      valid: false,
      amountReceived: 0,
      currency: 'BTC',
      error: `Recipient address mismatch. Transfer was not sent to the configured Bitcoin deposit address (${expectedToAddress}).`
    };
  }

  const amountReceivedBtc = matchingSatoshis / 100000000; // 100M satoshis per BTC
  // Tolerance check (95% of expected to account for minor fee deductions)
  const minAcceptable = requiredBtcAmount * 0.95;

  if (amountReceivedBtc < minAcceptable) {
    return {
      valid: false,
      amountReceived: amountReceivedBtc,
      currency: 'BTC',
      error: `Insufficient BTC received. Expected ~${requiredBtcAmount.toFixed(6)} BTC, but received ${amountReceivedBtc.toFixed(6)} BTC.`
    };
  }

  const isConfirmed = Boolean(rawData.status?.confirmed);

  return {
    valid: true,
    amountReceived: amountReceivedBtc,
    currency: 'BTC',
    confirmed: isConfirmed,
    recipient: matchedRecipient || expectedToAddress,
    txDetails: {
      hash: rawData.txid,
      blockHeight: rawData.status?.block_height,
      blockTime: rawData.status?.block_time,
      fee: rawData.fee
    }
  };
}

/**
 * Verifies a Litecoin (LTC) transaction using Litecoinspace and Blockcypher APIs
 */
export async function verifyLtcTransaction(
  txHash: string,
  requiredLtcAmount: number,
  expectedToAddress: string = DEFAULT_LTC_DEPOSIT_ADDRESS
): Promise<CryptoVerifyResult> {
  const cleanHash = txHash.trim();

  if (!isValidTxHash(cleanHash)) {
    return {
      valid: false,
      amountReceived: 0,
      currency: 'LTC',
      error: 'Invalid Litecoin TxID format. A valid hash must be exactly 64 hexadecimal characters.'
    };
  }

  const cleanExpectedAddr = expectedToAddress.trim().toLowerCase();

  // 1. Try litecoinspace.org (mempool.space API for Litecoin)
  try {
    const res = await fetch(`https://litecoinspace.org/api/tx/${encodeURIComponent(cleanHash)}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000)
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.txid) {
        let matchingLitoshis = 0;
        let matchedRecipient = '';

        for (const out of (data.vout || [])) {
          const addr = (out.scriptpubkey_address || '').trim().toLowerCase();
          if (addr && addr === cleanExpectedAddr) {
            matchingLitoshis += (out.value || 0);
            matchedRecipient = out.scriptpubkey_address;
          }
        }

        if (matchingLitoshis <= 0) {
          return {
            valid: false,
            amountReceived: 0,
            currency: 'LTC',
            error: `Recipient address mismatch. Transfer was not sent to your configured Litecoin deposit address (${expectedToAddress}).`
          };
        }

        const ltcReceived = matchingLitoshis / 100000000;
        const minAcceptable = requiredLtcAmount * 0.95;

        if (ltcReceived < minAcceptable) {
          return {
            valid: false,
            amountReceived: ltcReceived,
            currency: 'LTC',
            error: `Insufficient LTC received. Expected ~${requiredLtcAmount.toFixed(4)} LTC, but received ${ltcReceived.toFixed(4)} LTC.`
          };
        }

        return {
          valid: true,
          amountReceived: ltcReceived,
          currency: 'LTC',
          confirmed: Boolean(data.status?.confirmed),
          recipient: matchedRecipient || expectedToAddress,
          txDetails: {
            hash: data.txid,
            blockHeight: data.status?.block_height,
            blockTime: data.status?.block_time
          }
        };
      }
    }
  } catch (err) {
    console.warn('Litecoinspace query failed, trying blockcypher fallback:', err);
  }

  // 2. Fallback to Blockcypher API
  try {
    const bcRes = await fetch(`https://api.blockcypher.com/v1/ltc/main/txs/${encodeURIComponent(cleanHash)}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000)
    });

    if (bcRes.ok) {
      const bcData = await bcRes.json();
      if (bcData && bcData.hash) {
        let matchingLitoshis = 0;
        for (const out of (bcData.outputs || [])) {
          const matches = (out.addresses || []).some((a: string) => a.trim().toLowerCase() === cleanExpectedAddr);
          if (matches) {
            matchingLitoshis += (out.value || 0);
          }
        }

        if (matchingLitoshis <= 0) {
          return {
            valid: false,
            amountReceived: 0,
            currency: 'LTC',
            error: `Recipient address mismatch. Transfer was not sent to your configured Litecoin deposit address (${expectedToAddress}).`
          };
        }

        const ltcReceived = matchingLitoshis / 100000000;
        const minAcceptable = requiredLtcAmount * 0.95;

        if (ltcReceived < minAcceptable) {
          return {
            valid: false,
            amountReceived: ltcReceived,
            currency: 'LTC',
            error: `Insufficient LTC received. Expected ~${requiredLtcAmount.toFixed(4)} LTC, but received ${ltcReceived.toFixed(4)} LTC.`
          };
        }

        return {
          valid: true,
          amountReceived: ltcReceived,
          currency: 'LTC',
          confirmed: (bcData.confirmations || 0) > 0,
          recipient: expectedToAddress,
          txDetails: {
            hash: bcData.hash,
            confirmations: bcData.confirmations,
            blockHeight: bcData.block_height
          }
        };
      }
    }
  } catch (fallbackErr) {
    console.warn('Blockcypher fallback notice:', fallbackErr);
  }

  return {
    valid: false,
    amountReceived: 0,
    currency: 'LTC',
    error: 'Litecoin transaction hash not found on blockchain or mempool. Please verify the TxID and try again in 30 seconds.'
  };
}

/**
 * Universal Multi-Crypto Verifier
 */
export async function verifyCryptoTransaction(
  method: PaymentMethod,
  txHash: string,
  requiredUsdt: number,
  requiredCryptoAmount: number,
  depositAddress: string,
  usdtContract?: string
): Promise<CryptoVerifyResult> {
  if (method === 'btc') {
    return await verifyBtcTransaction(txHash, requiredCryptoAmount, depositAddress);
  }
  if (method === 'ltc') {
    return await verifyLtcTransaction(txHash, requiredCryptoAmount, depositAddress);
  }

  // Default TRON TRC-20 USDT
  const tronRes: TronVerifyResult = await verifyTronTransaction(
    txHash,
    requiredUsdt,
    depositAddress,
    usdtContract
  );

  return {
    valid: tronRes.valid,
    amountReceived: tronRes.amountReceived,
    currency: 'USDT',
    error: tronRes.error,
    confirmed: tronRes.confirmed,
    contractRet: tronRes.contractRet,
    recipient: tronRes.recipient,
    txDetails: tronRes.txDetails
  };
}
