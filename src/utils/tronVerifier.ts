import { TronVerifyResult } from '../types';

export const DEFAULT_TRON_DEPOSIT_ADDRESS = 'TYDzsYUE29eAQfMnA7WPZcaK5f46zMPwnT';
export const OFFICIAL_TRON_USDT_CONTRACT = 'TR7NHqjekKQxGTCi8q8ZY4pL8otSzgjLj6';
export const ALTERNATE_TRON_USDT_CONTRACT = '3Z53w9LDwYf3aYruqAiVpMURFwPMR9jYVGvjbubE9WaM';

/**
 * Validates a 64-character hexadecimal transaction hash
 */
export function isValidTxHash(hash: string): boolean {
  return /^[a-fA-F0-9]{64}$/.test(hash.trim());
}

/**
 * Verifies a TRC-20 USDT transaction hash directly against Tronscan API
 * @param txHash 64-character transaction hash
 * @param requiredAmount Expected USDT amount (e.g., 10, 20, 50)
 * @param expectedToAddress The configured TRON deposit wallet address
 * @param customContract Optional custom token contract address
 */
export async function verifyTronTransaction(
  txHash: string,
  requiredAmount: number,
  expectedToAddress: string = DEFAULT_TRON_DEPOSIT_ADDRESS,
  customContract?: string
): Promise<TronVerifyResult> {
  const cleanHash = txHash.trim();

  if (!isValidTxHash(cleanHash)) {
    return {
      valid: false,
      amountReceived: 0,
      error: 'Invalid TRON TxID format. A valid hash must be exactly 64 hexadecimal characters.'
    };
  }

  const endpoint = `https://apilist.tronscanapi.com/api/transaction-info?hash=${encodeURIComponent(cleanHash)}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        valid: false,
        amountReceived: 0,
        error: `Tronscan API returned HTTP status ${response.status}. Transaction may still be broadcasting to the mempool.`
      };
    }

    const data = await response.json();

    // Check if transaction exists on Tronscan
    if (!data || Object.keys(data).length === 0 || !data.hash) {
      return {
        valid: false,
        amountReceived: 0,
        error: 'Transaction hash not found on TRON blockchain. Please ensure you copied the correct TxID and try again in 30 seconds.'
      };
    }

    // 1. Verify contract execution status
    if (data.contractRet !== 'SUCCESS') {
      return {
        valid: false,
        amountReceived: 0,
        error: `Transaction execution failed on-chain with status: ${data.contractRet || 'UNKNOWN_ERROR'}`
      };
    }

    // 2. Verify confirmation status
    if (data.confirmed !== true) {
      return {
        valid: false,
        amountReceived: 0,
        confirmed: false,
        error: 'Transaction is still unconfirmed on TRON. Please wait for at least 19 block confirmations (~60 seconds).'
      };
    }

    // 3. Inspect TRC-20 transfers inside transaction payload
    const trc20Transfers = data.trc20TransferInfo || [];
    let matchingTransfer = null;
    const allowedContracts = [
      OFFICIAL_TRON_USDT_CONTRACT.toLowerCase(),
      ALTERNATE_TRON_USDT_CONTRACT.toLowerCase(),
      ...(customContract ? [customContract.toLowerCase()] : [])
    ];

    if (trc20Transfers.length > 0) {
      // Find transfer matching our deposit address and USDT contract
      matchingTransfer = trc20Transfers.find((transfer: any) => {
        const toMatch = transfer.to_address?.trim().toLowerCase() === expectedToAddress.trim().toLowerCase();
        const contractMatch = allowedContracts.includes(transfer.contract_address?.trim().toLowerCase()) ||
          transfer.symbol?.toUpperCase() === 'USDT';
        return toMatch && contractMatch;
      });
    }

    // Fallback: check normal trigger smart contract data if trc20TransferInfo array is structured differently
    if (!matchingTransfer && data.trigger_info) {
      const trigger = data.trigger_info;
      const toAddr = trigger.parameter?._to || trigger.to_address;
      const contractAddr = trigger.contract_address;
      if (
        toAddr?.trim().toLowerCase() === expectedToAddress.trim().toLowerCase() &&
        allowedContracts.includes(contractAddr?.trim().toLowerCase())
      ) {
        matchingTransfer = {
          amount_str: trigger.parameter?._value,
          decimals: 6,
          to_address: toAddr,
          symbol: 'USDT'
        };
      }
    }

    if (!matchingTransfer) {
      // Check if recipient address was wrong or wrong contract was transferred
      const recipientMatches = trc20Transfers.some(
        (t: any) => t.to_address?.trim().toLowerCase() === expectedToAddress.trim().toLowerCase()
      );

      if (!recipientMatches) {
        return {
          valid: false,
          amountReceived: 0,
          error: `Recipient address mismatch. Transfer was not sent to your configured deposit address (${expectedToAddress}).`
        };
      }

      return {
        valid: false,
        amountReceived: 0,
        error: 'No valid TRC-20 USDT transfer found in this transaction hash.'
      };
    }

    // 4. Parse decimal amounts (USDT on TRON has 6 decimals)
    const rawAmount = matchingTransfer.amount_str || matchingTransfer.quant || '0';
    const decimals = matchingTransfer.decimals ?? 6;
    const amountReceived = parseFloat(rawAmount) / Math.pow(10, decimals);

    if (isNaN(amountReceived) || amountReceived <= 0) {
      return {
        valid: false,
        amountReceived: 0,
        error: 'Unable to parse transferred USDT value from transaction log.'
      };
    }

    // 5. Verify received amount meets or exceeds required order amount
    if (amountReceived < requiredAmount) {
      return {
        valid: false,
        amountReceived,
        error: `Insufficient USDT transferred. Expected at least ${requiredAmount} USDT, but received ${amountReceived.toFixed(2)} USDT.`
      };
    }

    return {
      valid: true,
      amountReceived,
      confirmed: true,
      contractRet: 'SUCCESS',
      recipient: matchingTransfer.to_address,
      txDetails: {
        hash: data.hash,
        block: data.block,
        timestamp: data.timestamp,
        fee: data.cost?.net_fee || 0
      }
    };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return {
        valid: false,
        amountReceived: 0,
        error: 'Verification timed out while querying Tronscan. Please try again in a few moments.'
      };
    }

    return {
      valid: false,
      amountReceived: 0,
      error: `Network error reaching Tronscan: ${err?.message || 'Failed to fetch transaction data'}`
    };
  }
}
