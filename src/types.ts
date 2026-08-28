export interface AAMVAData {
  fileType: 'DL' | 'ID';
  ver: '10' | '09' | '08' | '05';
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

export interface Order {
  id: string;
  user_id: string;
  user_email: string;
  amount_usdt: number;
  tokens_to_credit: number;
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

export interface TronVerifyResult {
  valid: boolean;
  amountReceived: number;
  error?: string;
  confirmed?: boolean;
  contractRet?: string;
  recipient?: string;
  txDetails?: any;
}
