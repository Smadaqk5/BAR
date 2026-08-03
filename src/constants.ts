import { AAMVAData, FieldHelp } from './types';

export const IIN_MAPPING: Record<string, string> = {
  // Canada
  'PE': '604426', // Prince Edward Island
  'QC': '604428', // Quebec
  'YT': '604429', // Yukon
  'AB': '604432', // Alberta
  'NU': '604433', // Nunavut
  'NT': '604434', // Northwest Territories
  'ON': '636012', // Ontario
  'NS': '636013', // Nova Scotia
  'NL': '636016', // Newfoundland and Labrador
  'NF': '636016', // Newfoundland
  'NB': '636017', // New Brunswick
  'BC': '636028', // British Columbia
  'SK': '636044', // Saskatchewan
  'MB': '636048', // Manitoba

  // USA States & Territories
  'AS': '604427', // American Samoa
  'MP': '604430', // Northern Mariana Islands
  'PR': '604431', // Puerto Rico
  'VA': '636000', // Virginia
  'NY': '636001', // New York
  'MA': '636002', // Massachusetts
  'MD': '636003', // Maryland
  'NC': '636004', // North Carolina
  'SC': '636005', // South Carolina
  'CT': '636006', // Connecticut
  'LA': '636007', // Louisiana
  'MT': '636008', // Montana
  'NM': '636009', // New Mexico
  'FL': '636010', // Florida
  'DE': '636011', // Delaware
  'CA': '636014', // California
  'TX': '636015', // Texas
  'IA': '636018', // Iowa
  'GU': '636019', // Guam
  'CO': '636020', // Colorado
  'GM': '636020', // Colorado (GM code from document)
  'AR': '636021', // Arkansas
  'KS': '636022', // Kansas
  'OH': '636023', // Ohio
  'VT': '636024', // Vermont
  'PA': '636025', // Pennsylvania
  'AZ': '636026', // Arizona
  'DS': '636027', // State Dept. (Diplomatic)
  'OR': '636029', // Oregon
  'MO': '636030', // Missouri
  'WI': '636031', // Wisconsin
  'MI': '636032', // Michigan
  'AL': '636033', // Alabama
  'ND': '636034', // North Dakota
  'IL': '636035', // Illinois
  'NJ': '636036', // New Jersey
  'IN': '636037', // Indiana
  'MN': '636038', // Minnesota
  'NH': '636039', // New Hampshire
  'UT': '636040', // Utah
  'ME': '636041', // Maine
  'SD': '636042', // South Dakota
  'DC': '636043', // District of Columbia
  'WA': '636045', // Washington
  'KY': '636046', // Kentucky
  'HI': '636047', // Hawaii
  'NV': '636049', // Nevada
  'ID': '636050', // Idaho
  'MS': '636051', // Mississippi
  'RI': '636052', // Rhode Island
  'TN': '636053', // Tennessee
  'NE': '636054', // Nebraska
  'GA': '636055', // Georgia
  'OK': '636058', // Oklahoma
  'AK': '636059', // Alaska
  'WY': '636060', // Wyoming
  'WV': '636061', // West Virginia
  'VI': '636062', // Virgin Islands

  // Mexico
  'CU': '636056', // Coahuila
  'HL': '636057', // Hidalgo
};

export const US_STATES = [
  { code: 'AK', name: 'Alaska' },
  { code: 'AL', name: 'Alabama' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DC', name: 'District of Columbia' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'IA', name: 'Iowa' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MD', name: 'Maryland' },
  { code: 'ME', name: 'Maine' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MT', name: 'Montana' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NY', name: 'New York' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VA', name: 'Virginia' },
  { code: 'VT', name: 'Vermont' },
  { code: 'WA', name: 'Washington' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WY', name: 'Wyoming' }
];

export const CAN_PROVINCES = [
  { code: 'AB', name: 'Alberta' },
  { code: 'BC', name: 'British Columbia' },
  { code: 'MB', name: 'Manitoba' },
  { code: 'NB', name: 'New Brunswick' },
  { code: 'NL', name: 'Newfoundland and Labrador' },
  { code: 'NS', name: 'Nova Scotia' },
  { code: 'NT', name: 'Northwest Territories' },
  { code: 'NU', name: 'Nunavut' },
  { code: 'ON', name: 'Ontario' },
  { code: 'PE', name: 'Prince Edward Island' },
  { code: 'QC', name: 'Quebec' },
  { code: 'SK', name: 'Saskatchewan' },
  { code: 'YT', name: 'Yukon' }
];

export const EYE_COLORS = [
  { code: 'BAL', name: 'Bald (BAL)' },
  { code: 'BLK', name: 'Black (BLK)' },
  { code: 'BLU', name: 'Blue (BLU)' },
  { code: 'BRO', name: 'Brown (BRO)' },
  { code: 'GRN', name: 'Green (GRN)' },
  { code: 'GRY', name: 'Gray (GRY)' },
  { code: 'HAZ', name: 'Hazel (HAZ)' },
  { code: 'MAR', name: 'Maroon (MAR)' },
  { code: 'PNK', name: 'Pink (PNK)' },
  { code: 'UNK', name: 'Unknown (UNK)' }
];

export const HAIR_COLORS = [
  { code: 'BAL', name: 'Bald (BAL)' },
  { code: 'BLK', name: 'Black (BLK)' },
  { code: 'BLN', name: 'Blond (BLN)' },
  { code: 'BRO', name: 'Brown (BRO)' },
  { code: 'GRY', name: 'Gray (GRY)' },
  { code: 'RED', name: 'Red (RED)' },
  { code: 'WHI', name: 'White (WHI)' },
  { code: 'UNK', name: 'Unknown (UNK)' }
];

export const COMPLIANCE_OPTIONS = [
  { code: 'F', name: 'REAL ID Compliant (F)' },
  { code: 'N', name: 'Non-Compliant (N)' }
];

export const TRUNCATION_OPTIONS = [
  { code: 'N', name: 'Not Truncated (N)' },
  { code: 'T', name: 'Truncated (T)' },
  { code: 'U', name: 'Unknown (U)' }
];

export const GENDER_OPTIONS = [
  { code: '1', name: 'Male (1)' },
  { code: '2', name: 'Female (2)' },
  { code: '9', name: 'Unspecified/Other (9)' }
];

export const RACE_OPTIONS = [
  { code: 'U', name: 'Unknown (U)' },
  { code: 'W', name: 'White (W)' },
  { code: 'B', name: 'Black (B)' },
  { code: 'A', name: 'Asian (A)' },
  { code: 'I', name: 'American Indian (I)' },
  { code: 'P', name: 'Pacific Islander (P)' },
  { code: 'H', name: 'Hispanic (H)' },
  { code: 'O', name: 'Other (O)' }
];

export const DEFAULT_ALASKA_DEMO: AAMVAData = {
  fileType: 'DL',
  ver: '09',
  iin: '636059',
  jvn: '00',
  dcs: 'RODGERS',
  dac: 'TRE',
  dad: '',
  dbb: '12201983',
  dbc: '1',
  day: 'BLK',
  daz: '',
  dau: '600',
  daw: '',
  dag: '1600 A ST',
  dai: 'ANCHORAGE',
  daj: 'AK',
  dak: '99501',
  daq: '7379812',
  dcg: 'USA',
  dbd: '10022019',
  dba: '10022027',
  ddb: '',
  dcf: '6923468092137384APE0',
  dda: 'F',
  dck: '9876543210',
  dcl: 'U',
  dca: '',
  dcb: '',
  dcd: '',
  dde: 'N',
  ddf: 'N',
  ddg: 'N'
};

export const EMPTY_FORM: AAMVAData = {
  fileType: 'DL',
  ver: '09',
  iin: '',
  jvn: '00',
  dcs: '',
  dac: '',
  dad: '',
  dbb: '',
  dbc: '1',
  day: 'BRO',
  daz: '',
  dau: '',
  daw: '',
  dag: '',
  dai: '',
  daj: '',
  dak: '',
  daq: '',
  dcg: 'USA',
  dbd: '',
  dba: '',
  ddb: '',
  dcf: '',
  dda: 'N',
  dck: '',
  dcl: '',
  dca: '',
  dcb: '',
  dcd: '',
  dde: 'N',
  ddf: 'N',
  ddg: 'N'
};

export const HELP_HINTS: Record<string, FieldHelp> = {
  fileType: {
    fieldName: 'fileType',
    title: 'File Type (HDR)',
    hint: 'Specifies document class. DL = Driver License, ID = Identification Card.'
  },
  ver: {
    fieldName: 'ver',
    title: 'AAMVA Standard Version (HDR)',
    hint: 'The version of AAMVA standard to build. V09 is the Alaska/Rodgers reference spec.'
  },
  iin: {
    fieldName: 'iin',
    title: 'Issuer ID Number (HDR)',
    hint: '6-digit code identifying the card-issuing state. (e.g. 636059 for Alaska, 636014 for California).'
  },
  jvn: {
    fieldName: 'jvn',
    title: 'Jurisdiction Version (HDR)',
    hint: 'State-specific code implementation version, usually two digits (default: 00).'
  },
  dcs: {
    fieldName: 'dcs',
    title: 'Last Name / Family Name (DCS)',
    hint: 'Your family surname. MUST BE IN ALL CAPS. Standard automatically capitalizes as you type.'
  },
  dac: {
    fieldName: 'dac',
    title: 'First Name / Given Name (DAC)',
    hint: 'Your legal first name. MUST BE IN ALL CAPS. Standard automatically capitalizes as you type.'
  },
  dad: {
    fieldName: 'dad',
    title: 'Middle Name / Initials (DAD)',
    hint: 'Legal middle name or initials. Let it be empty if none. Still printed in the string.'
  },
  dbb: {
    fieldName: 'dbb',
    title: 'Date of Birth (DBB)',
    hint: 'Date of birth formatting MUST be exactly MMDDYYYY (8 digits, e.g. 12201983 for Dec 20, 1983).'
  },
  dbc: {
    fieldName: 'dbc',
    title: 'Sex / Gender (DBC)',
    hint: 'Primary sex identifier. 1 = Male, 2 = Female, 9 = Unspecified.'
  },
  day: {
    fieldName: 'day',
    title: 'Eye Color (DAY)',
    hint: '3-letter AAMVA standard eye color tag (e.g., BRO = Brown, BLU = Blue, BLK = Black).'
  },
  daz: {
    fieldName: 'daz',
    title: 'Hair Color (DAZ) (Optional)',
    hint: '3-letter AAMVA standard hair color tag (e.g., BLK = Black, BLN = Blond, RED = Red).'
  },
  dau: {
    fieldName: 'dau',
    title: 'Height (DAU)',
    hint: '🚨 ENTER IN FEET & INCHES. Enters as a 3-digit code: first digit is feet, last two are inches (e.g., 6\'0" = 600, 5\'11" = 511, 5\'9" = 509). Do not write raw inches!'
  },
  daw: {
    fieldName: 'daw',
    title: 'Weight (DAW) (Optional)',
    hint: '3-digit physical weight in pounds (or kilograms if applicable). Omitted if empty.'
  },
  dag: {
    fieldName: 'dag',
    title: 'Street Address (DAG)',
    hint: 'Full physical address. MUST BE IN ALL CAPS. Standard automatically capitalizes as you type.'
  },
  dai: {
    fieldName: 'dai',
    title: 'City (DAI)',
    hint: 'Resident city or township. MUST BE IN ALL CAPS. Standard automatically capitalizes as you type.'
  },
  daj: {
    fieldName: 'daj',
    title: 'State / Province (DAJ)',
    hint: '2-character state code corresponding to location (e.g., AK for Alaska, CA for California).'
  },
  dak: {
    fieldName: 'dak',
    title: 'Postal / ZIP Code (DAK)',
    hint: 'Zip or postal code. Keeps alphanumeric chars only; automatically strips any spaces or dashes.'
  },
  daq: {
    fieldName: 'daq',
    title: 'Document Number / ID (DAQ)',
    hint: 'Driver License or State ID number. MUST BE IN ALL CAPS. Do not input spaces or dashes.'
  },
  dcg: {
    fieldName: 'dcg',
    title: 'Country (DCG)',
    hint: 'Country of registration. Select USA or CAN.'
  },
  dbd: {
    fieldName: 'dbd',
    title: 'Document Issue Date (DBD)',
    hint: 'The date card was issued in MMDDYYYY format. (e.g. 10022019 for October 2, 2019).'
  },
  dba: {
    fieldName: 'dba',
    title: 'Document Expiration Date (DBA)',
    hint: 'The date card expires in MMDDYYYY format. (e.g. 10022027 for October 2, 2027).'
  },
  ddb: {
    fieldName: 'ddb',
    title: 'Revision Date (DDB) (Optional)',
    hint: 'Date of most recent update/revision in MMDDYYYY format. Omitted if empty.'
  },
  dcf: {
    fieldName: 'dcf',
    title: 'Document Discriminator (DCF)',
    hint: 'Unique inventory or barcode tracking code assigned by issuing authority.'
  },
  dda: {
    fieldName: 'dda',
    title: 'REAL ID Compliance (DDA)',
    hint: 'Compliance status indicators. F = REAL ID Compliant; N = Non-Compliant.'
  },
  dck: {
    fieldName: 'dck',
    title: 'Inventory Control Number (DCK) (Optional)',
    hint: 'Logistics tracking or inventory catalog code assigned by jurisdiction.'
  },
  dcl: {
    fieldName: 'dcl',
    title: 'Race or Social Classification (DCL) (Optional)',
    hint: 'Demographic race classification code (e.g., U = Unknown, W = White, B = Black).'
  },
  dca: {
    fieldName: 'dca',
    title: 'Vehicle Class (DCA) (Optional)',
    hint: 'Authority codes representing permitted vehicle classifications (e.g., C, D).'
  },
  dcb: {
    fieldName: 'dcb',
    title: 'Driving Restrictions (DCB) (Optional)',
    hint: 'Limitation indicators representing physical driving rules (e.g., B = Corrective Lenses).'
  },
  dcd: {
    fieldName: 'dcd',
    title: 'Driving Endorsements (DCD) (Optional)',
    hint: 'Special vehicle endorsement permissions (e.g., M = Motorcycle, T = Double Trailers).'
  },
  dde: {
    fieldName: 'dde',
    title: 'Last Name Truncation (DDE)',
    hint: 'Indicates if surname was cut off during layout. N = Not Truncated, T = Truncated.'
  },
  ddf: {
    fieldName: 'ddf',
    title: 'First Name Truncation (DDF)',
    hint: 'Indicates if given name was cut off during layout. N = Not Truncated, T = Truncated.'
  },
  ddg: {
    fieldName: 'ddg',
    title: 'Middle Name Truncation (DDG)',
    hint: 'Indicates if middle name was cut off during layout. N = Not Truncated, T = Truncated.'
  }
};
