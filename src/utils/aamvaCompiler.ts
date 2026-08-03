import { AAMVAData } from '../types';

/**
 * Generates an AAMVA compliant raw string based on form fields.
 */
export function compileAAMVAString(data: AAMVAData): string {
  const fileType = (data.fileType || 'DL').trim();
  // Construct the subfile data body
  let subfile = `${fileType}\n`;

  // Mandatory fields in specified perfect order
  const mandatoryFields = [
    { tag: 'DAQ', value: data.daq },
    { tag: 'DCF', value: data.dcf },
    { tag: 'DBD', value: data.dbd },
    { tag: 'DBB', value: data.dbb },
    { tag: 'DBA', value: data.dba },
    { tag: 'DAC', value: data.dac },
    { tag: 'DDF', value: data.ddf },
    { tag: 'DAD', value: data.dad },
    { tag: 'DDG', value: data.ddg },
    { tag: 'DCS', value: data.dcs },
    { tag: 'DDE', value: data.dde },
    { tag: 'DAU', value: data.dau },
    { tag: 'DBC', value: data.dbc },
    { tag: 'DAY', value: data.day },
    { tag: 'DAG', value: data.dag },
    { tag: 'DAI', value: data.dai },
    { tag: 'DAJ', value: data.daj },
    { tag: 'DAK', value: data.dak },
    { tag: 'DCG', value: data.dcg },
    { tag: 'DDA', value: data.dda }
  ];

  mandatoryFields.forEach(f => {
    // Standard states: even when empty, the tag itself must still be written
    // with its line ending. E.g. "DAD\n" if middle name is blank.
    const cleanValue = (f.value === undefined || f.value === null) ? '' : String(f.value).trim();
    subfile += `${f.tag}${cleanValue}\n`;
  });

  // Optional fields
  const optionalFields = [
    { tag: 'DCK', value: data.dck },
    { tag: 'DCL', value: data.dcl },
    { tag: 'DDB', value: data.ddb },
    { tag: 'DCA', value: data.dca },
    { tag: 'DCB', value: data.dcb },
    { tag: 'DCD', value: data.dcd },
    { tag: 'DAZ', value: data.daz },
    { tag: 'DAW', value: data.daw }
  ];

  optionalFields.forEach(f => {
    const cleanValue = (f.value !== undefined && f.value !== null) ? String(f.value).trim() : '';
    if (cleanValue !== '') {
      subfile += `${f.tag}${cleanValue}\n`;
    }
  });

  // Header Calculations
  // IIN: 6 digits pad
  const iin = String(data.iin || '').trim().slice(0, 6).padEnd(6, '0');
  // version: 2 digits pad
  const ver = String(data.ver || '').trim().slice(0, 2).padStart(2, '0');
  // jurisdiction version: 2 digits pad
  const jvn = String(data.jvn || '').trim().slice(0, 2).padStart(2, '0');
  
  // Format fields: [01][TYPE(2)][OFFSET(4)][LENGTH(4)]
  const numSubfiles = '01';
  const typeStr = fileType.slice(0, 2);
  const offset = '0031'; // Fixed offset parameter (exactly 31 bytes of header)
  
  // Calculate subfile length in bytes
  const subfileLength = subfile.length;
  const lengthStr = String(subfileLength).padStart(4, '0');

  // Build the complete prefix: @\n\x1e\rANSI 
  // Character sequence: 
  // @ (1 byte)
  // \n (1 byte, LF)
  // \x1e (1 byte, RS Record Separator)
  // \r (1 byte, CR Carriage Return)
  // ANSI  (5 bytes: 'A', 'N', 'S', 'I', ' ')
  // Followed by headers, then subfile
  const headerPrefix = '@\n\x1e\rANSI ';
  
  const header = `${headerPrefix}${iin}${ver}${jvn}${numSubfiles}${typeStr}${offset}${lengthStr}`;
  
  return `${header}${subfile}`;
}

/**
 * Returns a human readable version of the code replacing invisible control characters with visible labels
 */
export function getReadableAAMVAString(raw: string): string {
  return raw
    .replace(/\n/g, '[LF]\n')
    .replace(/\r/g, '[CR]')
    .replace(/\x1e/g, '[RS]');
}
