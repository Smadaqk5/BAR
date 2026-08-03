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
