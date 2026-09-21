export interface AAMVAData {
  fileType: 'DL' | 'ID';
  ver: '11' | '10' | '09' | '08' | '05';
  iin: string;
  jvn: string;
  dcs: string;
  dac: string;
  dad: string;
  dbb: string;
  dbc: string;
  day: string;
  daz: string;
  dau: string; // FII format: e.g. 600 or 511
  daw: string;
  dag: string;
  dai: string;
  daj: string;
  dak: string;
  daq: string;
  dcg: string;
  dbd: string;
  dba: string;
  ddb: string;
  dcf: string;
  dda: 'F' | 'N';
  dck: string;
  dcl: string;
  dca: string;
  dcb: string;
  dcd: string;
  dde: 'N' | 'T' | 'U';
  ddf: 'N' | 'T' | 'U';
  ddg: 'N' | 'T' | 'U';
  ddl?: string; // DDL - Veteran Indicator: U.S. military veteran designation (e.g. '1' = Veteran)
  ddk?: string; // DDK - Organ Donor: Registered organ donor (e.g. '1' = Registered Organ Donor)
}

export interface FieldHelp {
  fieldName: string;
  title: string;
  hint: string;
}

export type UserRole = 'admin' | 'client';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  token_balance: number;
  created_at: string;
}

export type OrderStatus = 'pending_payment' | 'verifying' | 'approved' | 'rejected';

export type PaymentMethod = 'usdt_trc20' | 'btc' | 'ltc';

export interface Order {
  id: string;
  user_id: string;
  user_email: string;
  amount_usdt: number;
  tokens_to_credit: number;
  payment_method?: PaymentMethod;
  crypto_amount?: number;
  crypto_currency?: 'USDT' | 'BTC' | 'LTC';
  deposit_address?: string;
  tx_hash?: string;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  verified_amount?: number;
  verification_note?: string;
}

export interface SavedClientProfile {
  id: string;
  title: string;
  jurisdiction: string;
  dln: string;
  createdAt: string;
  data: AAMVAData;
  barcodeString?: string;
  imageUrl?: string;
  userId?: string;
}

export interface TokenPackage {
  id: string;
  usdt: number;
  tokens: number;
  label: string;
  popular?: boolean;
  bonus?: string;
  description?: string;
  enabled?: boolean;
}

export interface TronVerifyResult {
  valid: boolean;
  amountReceived: number;
  error?: string;
  confirmed?: boolean;
  contractRet?: string;
  recipient?: string;
  txDetails?: any;
}

export interface CryptoVerifyResult {
  valid: boolean;
  amountReceived: number;
  currency: 'USDT' | 'BTC' | 'LTC';
  error?: string;
  confirmed?: boolean;
  contractRet?: string;
  recipient?: string;
  txDetails?: any;
}
