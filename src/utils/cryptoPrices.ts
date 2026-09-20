/**
 * Real-time cryptocurrency price fetcher with multi-provider fallbacks & local caching
 */

export interface CryptoRates {
  BTC: number;
  LTC: number;
  USDT: number;
  lastUpdated: number;
}

const DEFAULT_RATES: CryptoRates = {
  BTC: 82500,
  LTC: 62.5,
  USDT: 1.0,
  lastUpdated: Date.now()
};

const CACHE_TTL_MS = 60 * 1000; // 60 seconds cache
let cachedRates: CryptoRates = { ...DEFAULT_RATES };
let isFetching = false;

/**
 * Fetches latest live crypto rates from Binance, Coinbase, or CoinGecko
 */
export async function getCryptoRates(): Promise<CryptoRates> {
  const now = Date.now();
  if (now - cachedRates.lastUpdated < CACHE_TTL_MS && cachedRates.BTC > 0) {
    return cachedRates;
  }

  if (isFetching) {
    return cachedRates;
  }

  isFetching = true;

  try {
    // 1. Try Binance Public API
    const [btcRes, ltcRes] = await Promise.allSettled([
      fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', { signal: AbortSignal.timeout(4000) }),
      fetch('https://api.binance.com/api/v3/ticker/price?symbol=LTCUSDT', { signal: AbortSignal.timeout(4000) })
    ]);

    let btcPrice = 0;
    let ltcPrice = 0;

    if (btcRes.status === 'fulfilled' && btcRes.value.ok) {
      const btcJson = await btcRes.value.json();
      btcPrice = parseFloat(btcJson.price) || 0;
    }

    if (ltcRes.status === 'fulfilled' && ltcRes.value.ok) {
      const ltcJson = await ltcRes.value.json();
      ltcPrice = parseFloat(ltcJson.price) || 0;
    }

    // 2. Fallback to Coinbase if needed
    if (!btcPrice || !ltcPrice) {
      const [cbBtc, cbLtc] = await Promise.allSettled([
        fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot', { signal: AbortSignal.timeout(4000) }),
        fetch('https://api.coinbase.com/v2/prices/LTC-USD/spot', { signal: AbortSignal.timeout(4000) })
      ]);

      if (!btcPrice && cbBtc.status === 'fulfilled' && cbBtc.value.ok) {
        const j = await cbBtc.value.json();
        btcPrice = parseFloat(j.data?.amount) || 0;
      }
      if (!ltcPrice && cbLtc.status === 'fulfilled' && cbLtc.value.ok) {
        const j = await cbLtc.value.json();
        ltcPrice = parseFloat(j.data?.amount) || 0;
      }
    }

    // Apply values if successfully retrieved
    if (btcPrice > 1000) cachedRates.BTC = btcPrice;
    if (ltcPrice > 5) cachedRates.LTC = ltcPrice;
    cachedRates.lastUpdated = Date.now();

    return cachedRates;
  } catch (err) {
    console.warn('Crypto rates fetch notice, using cached rates:', err);
    return cachedRates;
  } finally {
    isFetching = false;
  }
}

/**
 * Converts a USDT (USD) package price to exact cryptocurrency units
 */
export function calculateCryptoAmount(usdtAmount: number, currency: 'USDT' | 'BTC' | 'LTC', rates: CryptoRates): number {
  if (currency === 'USDT') {
    return usdtAmount;
  }
  if (currency === 'BTC') {
    const rate = rates.BTC || DEFAULT_RATES.BTC;
    const btc = usdtAmount / rate;
    // Round to 7 decimals, minimum 0.00001
    return Math.max(0.00001, parseFloat(btc.toFixed(7)));
  }
  if (currency === 'LTC') {
    const rate = rates.LTC || DEFAULT_RATES.LTC;
    const ltc = usdtAmount / rate;
    // Round to 5 decimals, minimum 0.001
    return Math.max(0.001, parseFloat(ltc.toFixed(5)));
  }
  return usdtAmount;
}

/**
 * Returns clean formatted string representation for crypto amounts
 */
export function formatCryptoAmount(amount: number, currency: 'USDT' | 'BTC' | 'LTC'): string {
  if (currency === 'USDT') {
    return `${amount.toFixed(2)} USDT`;
  }
  if (currency === 'BTC') {
    return `${amount.toFixed(6)} BTC`;
  }
  if (currency === 'LTC') {
    return `${amount.toFixed(4)} LTC`;
  }
  return `${amount}`;
}
