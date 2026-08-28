import { AAMVAData } from '../types';
import { IIN_MAPPING } from '../constants';
import { compileAAMVAString } from './aamvaCompiler';

export interface StateRuleInfo {
  code: string;
  name: string;
  iin: string;
  renewalYears: number;
  dlnRegex: string;
  dlnFormatDesc: string;
  citiesZips: Array<{ city: string; zip: string }>;
  minIssueAge?: number;
}

export const JURISDICTION_RULES: Record<string, StateRuleInfo> = {
  'AL': {
    code: 'AL', name: 'Alabama', iin: '636033', renewalYears: 4,
    dlnRegex: '^\\d{7,8}$', dlnFormatDesc: '7-8 Digits',
    citiesZips: [{ city: 'BIRMINGHAM', zip: '35203' }, { city: 'MONTGOMERY', zip: '36104' }, { city: 'HUNTSVILLE', zip: '35801' }]
  },
  'AK': {
    code: 'AK', name: 'Alaska', iin: '636059', renewalYears: 5,
    dlnRegex: '^\\d{7}$', dlnFormatDesc: '7 Digits',
    citiesZips: [{ city: 'ANCHORAGE', zip: '99501' }, { city: 'FAIRBANKS', zip: '99701' }, { city: 'JUNEAU', zip: '99801' }]
  },
  'AZ': {
    code: 'AZ', name: 'Arizona', iin: '636026', renewalYears: 5,
    dlnRegex: '^[A-Z]\\d{8}$', dlnFormatDesc: '1 Letter + 8 Digits',
    citiesZips: [{ city: 'PHOENIX', zip: '85001' }, { city: 'TUCSON', zip: '85701' }, { city: 'MESA', zip: '85201' }]
  },
  'AR': {
    code: 'AR', name: 'Arkansas', iin: '636021', renewalYears: 8,
    dlnRegex: '^\\d{9}$', dlnFormatDesc: '9 Digits',
    citiesZips: [{ city: 'LITTLE ROCK', zip: '72201' }, { city: 'FORT SMITH', zip: '72901' }, { city: 'FAYETTEVILLE', zip: '72701' }]
  },
  'CA': {
    code: 'CA', name: 'California', iin: '636014', renewalYears: 5,
    dlnRegex: '^[A-Z]\\d{7}$', dlnFormatDesc: '1 Letter + 7 Digits',
    citiesZips: [{ city: 'LOS ANGELES', zip: '90012' }, { city: 'SAN FRANCISCO', zip: '94102' }, { city: 'SAN DIEGO', zip: '92101' }, { city: 'SACRAMENTO', zip: '95814' }]
  },
  'CO': {
    code: 'CO', name: 'Colorado', iin: '636020', renewalYears: 5,
    dlnRegex: '^\\d{9}$', dlnFormatDesc: '9 Digits',
    citiesZips: [{ city: 'DENVER', zip: '80202' }, { city: 'COLORADO SPRINGS', zip: '80903' }, { city: 'AURORA', zip: '80012' }]
  },
  'CT': {
    code: 'CT', name: 'Connecticut', iin: '636006', renewalYears: 6,
    dlnRegex: '^\\d{9}$', dlnFormatDesc: '9 Digits',
    citiesZips: [{ city: 'HARTFORD', zip: '06103' }, { city: 'NEW HAVEN', zip: '06510' }, { city: 'STAMFORD', zip: '06901' }]
  },
  'DE': {
    code: 'DE', name: 'Delaware', iin: '636011', renewalYears: 8,
    dlnRegex: '^\\d{7}$', dlnFormatDesc: '7 Digits',
    citiesZips: [{ city: 'WILMINGTON', zip: '19801' }, { city: 'DOVER', zip: '19901' }, { city: 'NEWARK', zip: '19711' }]
  },
  'DC': {
    code: 'DC', name: 'District of Columbia', iin: '636043', renewalYears: 8,
    dlnRegex: '^\\d{7}$', dlnFormatDesc: '7 Digits',
    citiesZips: [{ city: 'WASHINGTON', zip: '20001' }, { city: 'WASHINGTON', zip: '20005' }, { city: 'WASHINGTON', zip: '20009' }]
  },
  'FL': {
    code: 'FL', name: 'Florida', iin: '636010', renewalYears: 8,
    dlnRegex: '^[A-Z]\\d{12}$', dlnFormatDesc: '1 Letter + 12 Digits (Soundex)',
    citiesZips: [{ city: 'MIAMI', zip: '33101' }, { city: 'ORLANDO', zip: '32801' }, { city: 'TAMPA', zip: '33602' }]
  },
  'GA': {
    code: 'GA', name: 'Georgia', iin: '636055', renewalYears: 8,
    dlnRegex: '^\\d{9}$', dlnFormatDesc: '9 Digits',
    citiesZips: [{ city: 'ATLANTA', zip: '30303' }, { city: 'SAVANNAH', zip: '31401' }, { city: 'AUGUSTA', zip: '30901' }]
  },
  'HI': {
    code: 'HI', name: 'Hawaii', iin: '636047', renewalYears: 8,
    dlnRegex: '^H\\d{8}$', dlnFormatDesc: 'Letter H + 8 Digits',
    citiesZips: [{ city: 'HONOLULU', zip: '96813' }, { city: 'HILO', zip: '96720' }, { city: 'KAILUA', zip: '96734' }]
  },
  'ID': {
    code: 'ID', name: 'Idaho', iin: '636050', renewalYears: 8,
    dlnRegex: '^[A-Z]{2}\\d{6}[A-Z]$', dlnFormatDesc: '2 Letters + 6 Digits + 1 Letter',
    citiesZips: [{ city: 'BOISE', zip: '83702' }, { city: 'MERIDIAN', zip: '83642' }, { city: 'NAMPA', zip: '83651' }]
  },
  'IL': {
    code: 'IL', name: 'Illinois', iin: '636035', renewalYears: 4,
    dlnRegex: '^[A-Z]\\d{11}$', dlnFormatDesc: '1 Letter + 11 Digits',
    citiesZips: [{ city: 'CHICAGO', zip: '60601' }, { city: 'SPRINGFIELD', zip: '62701' }, { city: 'PEORIA', zip: '61602' }]
  },
  'IN': {
    code: 'IN', name: 'Indiana', iin: '636037', renewalYears: 6,
    dlnRegex: '^\\d{10}$', dlnFormatDesc: '10 Digits',
    citiesZips: [{ city: 'INDIANAPOLIS', zip: '46204' }, { city: 'FORT WAYNE', zip: '46802' }, { city: 'EVANSVILLE', zip: '47708' }]
  },
  'IA': {
    code: 'IA', name: 'Iowa', iin: '636018', renewalYears: 8,
    dlnRegex: '^\\d{9}$', dlnFormatDesc: '9 Digits',
    citiesZips: [{ city: 'DES MOINES', zip: '50309' }, { city: 'CEDAR RAPIDS', zip: '52401' }, { city: 'DAVENPORT', zip: '52801' }]
  },
  'KS': {
    code: 'KS', name: 'Kansas', iin: '636022', renewalYears: 6,
    dlnRegex: '^K\\d{8}$', dlnFormatDesc: 'Letter K + 8 Digits',
    citiesZips: [{ city: 'WICHITA', zip: '67202' }, { city: 'OVERLAND PARK', zip: '66212' }, { city: 'TOPEKA', zip: '66603' }]
  },
  'KY': {
    code: 'KY', name: 'Kentucky', iin: '636046', renewalYears: 8,
    dlnRegex: '^[A-Z]\\d{8}$', dlnFormatDesc: '1 Letter + 8 Digits',
    citiesZips: [{ city: 'LOUISVILLE', zip: '40202' }, { city: 'LEXINGTON', zip: '40507' }, { city: 'FRANKFORT', zip: '40601' }]
  },
  'LA': {
    code: 'LA', name: 'Louisiana', iin: '636007', renewalYears: 6,
    dlnRegex: '^00\\d{7}$', dlnFormatDesc: '00 Prefix + 7 Digits (9 total)',
    citiesZips: [{ city: 'NEW ORLEANS', zip: '70112' }, { city: 'BATON ROUGE', zip: '70802' }, { city: 'SHREVEPORT', zip: '71101' }]
  },
  'ME': {
    code: 'ME', name: 'Maine', iin: '636041', renewalYears: 6,
    dlnRegex: '^\\d{7}$', dlnFormatDesc: '7 Digits',
    citiesZips: [{ city: 'PORTLAND', zip: '04101' }, { city: 'AUGUSTA', zip: '04330' }, { city: 'BANGOR', zip: '04401' }]
  },
  'MD': {
    code: 'MD', name: 'Maryland', iin: '636003', renewalYears: 8,
    dlnRegex: '^[A-Z]\\d{12}$', dlnFormatDesc: '1 Letter + 12 Digits (Soundex)',
    citiesZips: [{ city: 'BALTIMORE', zip: '21201' }, { city: 'ANNAPOLIS', zip: '21401' }, { city: 'ROCKVILLE', zip: '20850' }]
  },
  'MA': {
    code: 'MA', name: 'Massachusetts', iin: '636002', renewalYears: 5,
    dlnRegex: '^S\\d{8}$', dlnFormatDesc: 'Letter S + 8 Digits',
    citiesZips: [{ city: 'BOSTON', zip: '02108' }, { city: 'WORCESTER', zip: '01608' }, { city: 'CAMBRIDGE', zip: '02138' }]
  },
  'MI': {
    code: 'MI', name: 'Michigan', iin: '636032', renewalYears: 4,
    dlnRegex: '^[A-Z]\\d{12}$', dlnFormatDesc: '1 Letter + 12 Digits',
    citiesZips: [{ city: 'DETROIT', zip: '48226' }, { city: 'GRAND RAPIDS', zip: '49503' }, { city: 'ANN ARBOR', zip: '48104' }]
  },
  'MN': {
    code: 'MN', name: 'Minnesota', iin: '636038', renewalYears: 4,
    dlnRegex: '^[A-Z]\\d{12}$', dlnFormatDesc: '1 Letter + 12 Digits',
    citiesZips: [{ city: 'MINNEAPOLIS', zip: '55401' }, { city: 'SAINT PAUL', zip: '55101' }, { city: 'ROCHESTER', zip: '55901' }]
  },
  'MS': {
    code: 'MS', name: 'Mississippi', iin: '636051', renewalYears: 8,
    dlnRegex: '^\\d{9}$', dlnFormatDesc: '9 Digits',
    citiesZips: [{ city: 'JACKSON', zip: '39201' }, { city: 'GULFPORT', zip: '39501' }, { city: 'SOUTHAVEN', zip: '38671' }]
  },
  'MO': {
    code: 'MO', name: 'Missouri', iin: '636030', renewalYears: 6,
    dlnRegex: '^[A-Z]\\d{9}$', dlnFormatDesc: '1 Letter + 9 Digits',
    citiesZips: [{ city: 'KANSAS CITY', zip: '64106' }, { city: 'SAINT LOUIS', zip: '63101' }, { city: 'SPRINGFIELD', zip: '65806' }]
  },
  'MT': {
    code: 'MT', name: 'Montana', iin: '636008', renewalYears: 8,
    dlnRegex: '^[A-Z]\\d{8}$', dlnFormatDesc: '1 Letter + 8 Digits',
    citiesZips: [{ city: 'BILLINGS', zip: '59101' }, { city: 'MISSOULA', zip: '59801' }, { city: 'BOZEMAN', zip: '59715' }]
  },
  'NE': {
    code: 'NE', name: 'Nebraska', iin: '636054', renewalYears: 5,
    dlnRegex: '^[A-Z]\\d{8}$', dlnFormatDesc: '1 Letter + 8 Digits',
    citiesZips: [{ city: 'OMAHA', zip: '68102' }, { city: 'LINCOLN', zip: '68508' }, { city: 'BELLEVUE', zip: '68005' }]
  },
  'NV': {
    code: 'NV', name: 'Nevada', iin: '636049', renewalYears: 8,
    dlnRegex: '^\\d{10}$', dlnFormatDesc: '10 Digits',
    citiesZips: [{ city: 'LAS VEGAS', zip: '89101' }, { city: 'RENO', zip: '89501' }, { city: 'CARSON CITY', zip: '89701' }]
  },
  'NH': {
    code: 'NH', name: 'New Hampshire', iin: '636039', renewalYears: 5,
    dlnRegex: '^\\d{2}[A-Z]{3}\\d{5}$', dlnFormatDesc: '2 Digits + 3 Letters + 5 Digits',
    citiesZips: [{ city: 'MANCHESTER', zip: '03101' }, { city: 'NASHUA', zip: '03060' }, { city: 'CONCORD', zip: '03301' }]
  },
  'NJ': {
    code: 'NJ', name: 'New Jersey', iin: '636036', renewalYears: 4,
    dlnRegex: '^[A-Z]\\d{14}$', dlnFormatDesc: '1 Letter + 14 Digits',
    citiesZips: [{ city: 'NEWARK', zip: '07102' }, { city: 'JERSEY CITY', zip: '07302' }, { city: 'TRENTON', zip: '08608' }]
  },
  'NM': {
    code: 'NM', name: 'New Mexico', iin: '636009', renewalYears: 8,
    dlnRegex: '^\\d{9}$', dlnFormatDesc: '9 Digits',
    citiesZips: [{ city: 'ALBUQUERQUE', zip: '87102' }, { city: 'SANTA FE', zip: '87501' }, { city: 'LAS CRUCES', zip: '88001' }]
  },
  'NY': {
    code: 'NY', name: 'New York', iin: '636001', renewalYears: 8,
    dlnRegex: '^[A-Z]\\d{7}$', dlnFormatDesc: '1 Letter + 7 Digits',
    citiesZips: [{ city: 'NEW YORK', zip: '10001' }, { city: 'BUFFALO', zip: '14202' }, { city: 'ALBANY', zip: '12207' }]
  },
  'NC': {
    code: 'NC', name: 'North Carolina', iin: '636004', renewalYears: 8,
    dlnRegex: '^\\d{10}$', dlnFormatDesc: '10 Digits',
    citiesZips: [{ city: 'CHARLOTTE', zip: '28202' }, { city: 'RALEIGH', zip: '27601' }, { city: 'GREENSBORO', zip: '27401' }]
  },
  'ND': {
    code: 'ND', name: 'North Dakota', iin: '636034', renewalYears: 6,
    dlnRegex: '^[A-Z]{3}\\d{6}$', dlnFormatDesc: '3 Letters + 6 Digits',
    citiesZips: [{ city: 'FARGO', zip: '58102' }, { city: 'BISMARCK', zip: '58501' }, { city: 'GRAND FORKS', zip: '58201' }]
  },
  'OH': {
    code: 'OH', name: 'Ohio', iin: '636023', renewalYears: 4,
    dlnRegex: '^[A-Z]{2}\\d{6}$', dlnFormatDesc: '2 Letters + 6 Digits',
    citiesZips: [{ city: 'COLUMBUS', zip: '43215' }, { city: 'CLEVELAND', zip: '44114' }, { city: 'CINCINNATI', zip: '45202' }]
  },
  'OK': {
    code: 'OK', name: 'Oklahoma', iin: '636058', renewalYears: 8,
    dlnRegex: '^[A-Z]\\d{9}$', dlnFormatDesc: '1 Letter + 9 Digits',
    citiesZips: [{ city: 'OKLAHOMA CITY', zip: '73102' }, { city: 'TULSA', zip: '74103' }, { city: 'NORMAN', zip: '73069' }]
  },
  'OR': {
    code: 'OR', name: 'Oregon', iin: '636029', renewalYears: 8,
    dlnRegex: '^\\d{7}$', dlnFormatDesc: '7 Digits',
    citiesZips: [{ city: 'PORTLAND', zip: '97201' }, { city: 'SALEM', zip: '97301' }, { city: 'EUGENE', zip: '97401' }]
  },
  'PA': {
    code: 'PA', name: 'Pennsylvania', iin: '636025', renewalYears: 4,
    dlnRegex: '^\\d{8}$', dlnFormatDesc: '8 Digits',
    citiesZips: [{ city: 'PHILADELPHIA', zip: '19107' }, { city: 'PITTSBURGH', zip: '15219' }, { city: 'HARRISBURG', zip: '17101' }]
  },
  'RI': {
    code: 'RI', name: 'Rhode Island', iin: '636052', renewalYears: 5,
    dlnRegex: '^\\d{7}$', dlnFormatDesc: '7 Digits',
    citiesZips: [{ city: 'PROVIDENCE', zip: '02903' }, { city: 'WARWICK', zip: '02886' }, { city: 'NEWPORT', zip: '02840' }]
  },
  'SC': {
    code: 'SC', name: 'South Carolina', iin: '636005', renewalYears: 8,
    dlnRegex: '^\\d{9}$', dlnFormatDesc: '9 Digits',
    citiesZips: [{ city: 'CHARLESTON', zip: '29401' }, { city: 'COLUMBIA', zip: '29201' }, { city: 'GREENVILLE', zip: '29601' }]
  },
  'SD': {
    code: 'SD', name: 'South Dakota', iin: '636042', renewalYears: 5,
    dlnRegex: '^\\d{8}$', dlnFormatDesc: '8 Digits',
    citiesZips: [{ city: 'SIOUX FALLS', zip: '57104' }, { city: 'RAPID CITY', zip: '57701' }, { city: 'PIERRE', zip: '57501' }]
  },
  'TN': {
    code: 'TN', name: 'Tennessee', iin: '636053', renewalYears: 8,
    dlnRegex: '^\\d{8,9}$', dlnFormatDesc: '8-9 Digits',
    citiesZips: [{ city: 'NASHVILLE', zip: '37203' }, { city: 'MEMPHIS', zip: '38103' }, { city: 'KNOXVILLE', zip: '37902' }]
  },
  'TX': {
    code: 'TX', name: 'Texas', iin: '636015', renewalYears: 8,
    dlnRegex: '^\\d{8}$', dlnFormatDesc: '8 Digits',
    citiesZips: [{ city: 'HOUSTON', zip: '77002' }, { city: 'AUSTIN', zip: '78701' }, { city: 'DALLAS', zip: '75201' }, { city: 'SAN ANTONIO', zip: '78205' }]
  },
  'UT': {
    code: 'UT', name: 'Utah', iin: '636040', renewalYears: 8,
    dlnRegex: '^\\d{9}$', dlnFormatDesc: '9 Digits',
    citiesZips: [{ city: 'SALT LAKE CITY', zip: '84101' }, { city: 'PROVO', zip: '84601' }, { city: 'OGDEN', zip: '84401' }]
  },
  'VT': {
    code: 'VT', name: 'Vermont', iin: '636024', renewalYears: 4,
    dlnRegex: '^\\d{8}$', dlnFormatDesc: '8 Digits',
    citiesZips: [{ city: 'BURLINGTON', zip: '05401' }, { city: 'MONTPELIER', zip: '05602' }, { city: 'RUTLAND', zip: '05701' }]
  },
  'VA': {
    code: 'VA', name: 'Virginia', iin: '636000', renewalYears: 8,
    dlnRegex: '^[A-Z]\\d{8}$', dlnFormatDesc: '1 Letter + 8 Digits',
    citiesZips: [{ city: 'RICHMOND', zip: '23219' }, { city: 'VIRGINIA BEACH', zip: '23451' }, { city: 'ALEXANDRIA', zip: '22314' }]
  },
  'WA': {
    code: 'WA', name: 'Washington', iin: '636045', renewalYears: 6,
    dlnRegex: '^[A-Z0-9]{12}$', dlnFormatDesc: '12 Alphanumeric (WDL Soundex)',
    citiesZips: [{ city: 'SEATTLE', zip: '98101' }, { city: 'SPOKANE', zip: '99201' }, { city: 'TACOMA', zip: '98402' }]
  },
  'WV': {
    code: 'WV', name: 'West Virginia', iin: '636061', renewalYears: 5,
    dlnRegex: '^[A-Z]\\d{6}$', dlnFormatDesc: '1 Letter + 6 Digits',
    citiesZips: [{ city: 'CHARLESTON', zip: '25301' }, { city: 'HUNTINGTON', zip: '25701' }, { city: 'MORGANTOWN', zip: '26505' }]
  },
  'WI': {
    code: 'WI', name: 'Wisconsin', iin: '636031', renewalYears: 8,
    dlnRegex: '^[A-Z]\\d{13}$', dlnFormatDesc: '1 Letter + 13 Digits',
    citiesZips: [{ city: 'MILWAUKEE', zip: '53202' }, { city: 'MADISON', zip: '53703' }, { city: 'GREEN BAY', zip: '54301' }]
  },
  'WY': {
    code: 'WY', name: 'Wyoming', iin: '636060', renewalYears: 5,
    dlnRegex: '^\\d{9}$', dlnFormatDesc: '9 Digits',
    citiesZips: [{ city: 'CHEYENNE', zip: '82001' }, { city: 'CASPER', zip: '82601' }, { city: 'LARAMIE', zip: '82070' }]
  }
};

const FIRST_NAMES_MALE = [
  'JAMES', 'ROBERT', 'JOHN', 'MICHAEL', 'DAVID', 'WILLIAM', 'RICHARD', 'JOSEPH',
  'THOMAS', 'CHARLES', 'CHRISTOPHER', 'DANIEL', 'MATTHEW', 'ANTHONY', 'MARK',
  'DONALD', 'STEVEN', 'ANDREW', 'PAUL', 'JOSHUA', 'KENNETH', 'KEVIN', 'BRIAN',
  'GEORGE', 'TIMOTHY', 'RONALD', 'JASON', 'EDWARD', 'JEFFREY', 'RYAN', 'JACOB'
];

const FIRST_NAMES_FEMALE = [
  'MARY', 'PATRICIA', 'JENNIFER', 'LINDA', 'ELIZABETH', 'BARBARA', 'SUSAN',
  'JESSICA', 'SARAH', 'KAREN', 'LISA', 'NANCY', 'BETTY', 'MARGARET', 'SANDRA',
  'ASHLEY', 'KIMBERLY', 'EMILY', 'DONNA', 'MICHELLE', 'CAROL', 'AMANDA', 'MELISSA'
];

const LAST_NAMES = [
  'SMITH', 'JOHNSON', 'WILLIAMS', 'BROWN', 'JONES', 'GARCIA', 'MILLER', 'DAVIS',
  'RODRIGUEZ', 'MARTINEZ', 'HERNANDEZ', 'LOPEZ', 'GONZALEZ', 'WILSON', 'ANDERSON',
  'THOMAS', 'TAYLOR', 'MOORE', 'JACKSON', 'MARTIN', 'LEE', 'PEREZ', 'THOMPSON',
  'WHITE', 'HARRIS', 'SANCHEZ', 'CLARK', 'RAMIREZ', 'LEWIS', 'ROBINSON', 'WALKER'
];

const STREET_NAMES = [
  'MAIN ST', 'OAK AVE', 'MAPLE DR', 'CEDAR LN', 'WASHINGTON BLVD', 'LINCOLN WAY',
  'PINE ST', 'ELM ST', 'PARK AVE', 'LAKE RD', 'RIDGE WAY', 'SUNSET DR', 'BROADWAY',
  'HIGHLAND AVE', 'VALLEY VIEW RD', 'MEADOW LN', 'COLLEGE AVE', 'SPRING ST'
];

const EYE_COLORS = ['BRO', 'BLU', 'GRN', 'HAZ', 'GRY', 'BLK'];
const HAIR_COLORS = ['BRO', 'BLK', 'BLN', 'RED', 'GRY', 'WHI'];
const RACE_CODES = ['W', 'B', 'A', 'H', 'I', 'U'];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDigits(length: number): string {
  let res = '';
  for (let i = 0; i < length; i++) {
    res += Math.floor(Math.random() * 10).toString();
  }
  return res;
}

function randomChars(length: number, charset = 'ABCDEFGHJKLMNPRSTUVWXYZ'): string {
  let res = '';
  for (let i = 0; i < length; i++) {
    res += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return res;
}

export function generateStateDLN(stateCode: string): string {
  const code = stateCode.toUpperCase();
  const letters = 'ABCDEFGHJKLMNPRSTUVWXYZ';

  if (['AL', 'DE', 'DC', 'ME', 'OR', 'RI', 'AK'].includes(code)) {
    return randomDigits(7);
  }
  if (['AR', 'CO', 'CT', 'GA', 'IA', 'MS', 'NM', 'SC', 'UT', 'WY'].includes(code)) {
    return randomDigits(9);
  }
  if (['IN', 'NV', 'NC'].includes(code)) {
    return randomDigits(10);
  }
  if (['PA', 'TX', 'VT', 'SD', 'TN'].includes(code)) {
    return randomDigits(8);
  }
  if (code === 'LA') {
    return `00${randomDigits(7)}`;
  }
  if (code === 'CA') {
    return `${randomChars(1, letters)}${randomDigits(7)}`;
  }
  if (['AZ', 'KY', 'MT', 'NE', 'VA'].includes(code)) {
    return `${randomChars(1, letters)}${randomDigits(8)}`;
  }
  if (code === 'HI') {
    return `H${randomDigits(8)}`;
  }
  if (code === 'KS') {
    return `K${randomDigits(8)}`;
  }
  if (code === 'MA') {
    return `S${randomDigits(8)}`;
  }
  if (code === 'MO') {
    return `${randomChars(1, letters)}${randomDigits(9)}`;
  }
  if (code === 'IL') {
    return `${randomChars(1, letters)}${randomDigits(11)}`;
  }
  if (['FL', 'MD', 'MI', 'MN'].includes(code)) {
    return `${randomChars(1, letters)}${randomDigits(12)}`;
  }
  if (code === 'NJ') {
    return `${randomChars(1, letters)}${randomDigits(14)}`;
  }
  if (code === 'WI') {
    return `${randomChars(1, letters)}${randomDigits(13)}`;
  }
  if (code === 'WV') {
    return `${randomChars(1, letters)}${randomDigits(6)}`;
  }
  if (code === 'NY') {
    return `${randomChars(1, letters)}${randomDigits(7)}`;
  }
  if (code === 'OK') {
    return `${randomChars(1, letters)}${randomDigits(9)}`;
  }
  if (code === 'OH') {
    return `${randomChars(2, letters)}${randomDigits(6)}`;
  }
  if (code === 'ND') {
    return `${randomChars(3, letters)}${randomDigits(6)}`;
  }
  if (code === 'ID') {
    return `${randomChars(2, letters)}${randomDigits(6)}${randomChars(1, letters)}`;
  }
  if (code === 'NH') {
    return `${randomDigits(2)}${randomChars(3, letters)}${randomDigits(5)}`;
  }
  if (code === 'WA') {
    const alphanumeric = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
    return `WDL${randomChars(9, alphanumeric)}`;
  }

  return randomDigits(8);
}

export function generateAAMVADates(
  stateCode: string,
  dateMode: 'MMDDYYYY' | 'YYYYMMDD' = 'MMDDYYYY'
): { dbb: string; dbd: string; dba: string; dobDate: Date; issueDate: Date; expDate: Date } {
  const rule = JURISDICTION_RULES[stateCode] || JURISDICTION_RULES['CA'];
  const today = new Date();

  // Age between 18 and 75
  const ageYears = randomInt(18, 72);
  const birthYear = today.getFullYear() - ageYears;
  const birthMonth = randomInt(0, 11);
  const birthDay = randomInt(1, birthMonth === 1 ? 28 : (birthMonth in [3, 5, 8, 10] ? 30 : 31));
  const dobDate = new Date(birthYear, birthMonth, birthDay);

  // Issue date: min 16/18 yrs after DOB, up to today
  const minIssueDate = new Date(birthYear + (rule.minIssueAge || 16), birthMonth, birthDay);
  const renewalCycleYears = rule.renewalYears || 5;

  // Active license issued within last renewalCycleYears or after minIssueDate
  const earliestIssueTime = Math.max(
    minIssueDate.getTime(),
    today.getTime() - (renewalCycleYears - 0.5) * 365.25 * 24 * 3600 * 1000
  );
  
  const issueTime = randomInt(
    Math.min(earliestIssueTime, today.getTime() - 30 * 24 * 3600 * 1000),
    today.getTime()
  );
  const issueDate = new Date(issueTime);

  // Expiration date: in future, aligned to birthday in future renewal cycle
  let targetExpYear = issueDate.getFullYear() + renewalCycleYears;
  let expDate = new Date(targetExpYear, birthMonth, birthDay);
  
  while (expDate.getTime() <= today.getTime()) {
    targetExpYear += renewalCycleYears;
    expDate = new Date(targetExpYear, birthMonth, birthDay);
  }

  const formatStr = (d: Date): string => {
    const y = d.getFullYear().toString();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    if (dateMode === 'YYYYMMDD') {
      return `${y}${m}${day}`;
    }
    return `${m}${day}${y}`;
  };

  return {
    dbb: formatStr(dobDate),
    dbd: formatStr(issueDate),
    dba: formatStr(expDate),
    dobDate,
    issueDate,
    expDate
  };
}

export function generateSyntheticRecord(
  stateCode?: string,
  dateMode: 'MMDDYYYY' | 'YYYYMMDD' = 'MMDDYYYY'
): AAMVAData {
  const allStates = Object.keys(JURISDICTION_RULES);
  const selectedState = (stateCode && JURISDICTION_RULES[stateCode.toUpperCase()])
    ? stateCode.toUpperCase()
    : randomChoice(allStates);
  
  const rule = JURISDICTION_RULES[selectedState];
  const isMale = Math.random() > 0.5;
  const firstName = randomChoice(isMale ? FIRST_NAMES_MALE : FIRST_NAMES_FEMALE);
  const middleName = Math.random() > 0.25 ? randomChoice(isMale ? FIRST_NAMES_MALE : FIRST_NAMES_FEMALE) : '';
  const lastName = randomChoice(LAST_NAMES);
  const sex = isMale ? '1' : '2';

  const { dbb, dbd, dba, issueDate } = generateAAMVADates(selectedState, dateMode);

  const feet = randomChoice([5, 5, 5, 5, 6, 6, 4]);
  const inches = feet === 4 ? randomInt(10, 11) : (feet === 6 ? randomInt(0, 5) : randomInt(0, 11));
  const dau = `${feet}${inches.toString().padStart(2, '0')}`;

  const streetNum = randomInt(100, 9999);
  const streetName = randomChoice(STREET_NAMES);
  const cityZip = randomChoice(rule.citiesZips);

  const dln = generateStateDLN(selectedState);
  const issueYear = issueDate.getFullYear();
  const dcf = `${randomDigits(8)}${issueYear}${randomChars(6, '0123456789ABCDEF')}`;
  const dcg = `${selectedState}${issueYear}${randomDigits(7)}`;
  const dck = randomDigits(10);

  const iin = rule.iin || IIN_MAPPING[selectedState] || '636000';

  return {
    fileType: 'DL',
    ver: '10',
    iin: iin,
    jvn: '00',
    dcs: lastName,
    dac: firstName,
    dad: middleName,
    dbb: dbb,
    dbc: sex,
    day: randomChoice(EYE_COLORS),
    daz: randomChoice(HAIR_COLORS),
    dau: dau,
    daw: randomInt(120, 230).toString(),
    dag: `${streetNum} ${streetName}`,
    dai: cityZip.city,
    daj: selectedState,
    dak: cityZip.zip,
    daq: dln,
    dcg: dcg,
    dbd: dbd,
    dba: dba,
    ddb: '',
    dcf: dcf,
    dda: Math.random() > 0.15 ? 'F' : 'N',
    dck: dck,
    dcl: randomChoice(RACE_CODES),
    dca: 'C',
    dcb: Math.random() > 0.3 ? 'NONE' : 'B',
    dcd: Math.random() > 0.2 ? 'NONE' : 'M',
    dde: 'N',
    ddf: 'N',
    ddg: 'N'
  };
}

export function generateSyntheticDataset(options: {
  states?: string[];
  recordsPerState?: number;
  dateMode?: 'MMDDYYYY' | 'YYYYMMDD';
}): AAMVAData[] {
  const targetStates = options.states && options.states.length > 0
    ? options.states
    : Object.keys(JURISDICTION_RULES);
  const count = options.recordsPerState || 15;
  const dateMode = options.dateMode || 'MMDDYYYY';

  const dataset: AAMVAData[] = [];
  for (const st of targetStates) {
    if (!JURISDICTION_RULES[st]) continue;
    for (let i = 0; i < count; i++) {
      dataset.push(generateSyntheticRecord(st, dateMode));
    }
  }
  return dataset;
}

export function exportDatasetAsJSON(records: AAMVAData[]): string {
  return JSON.stringify(records, null, 2);
}

export function exportDatasetAsCSV(records: AAMVAData[]): string {
  if (records.length === 0) return '';
  const headers = [
    'daj_state', 'daq_dln', 'dcs_last_name', 'dac_first_name', 'dad_middle_name',
    'dbb_dob', 'dbd_issue', 'dba_expiry', 'dbc_sex', 'dau_height', 'daw_weight',
    'day_eye', 'daz_hair', 'dag_street', 'dai_city', 'dak_zip', 'iin', 'dcf_discriminator',
    'dcg_icn', 'dda_real_id', 'dca_class'
  ];

  const rows = records.map(r => [
    r.daj, r.daq, r.dcs, r.dac, r.dad || '',
    r.dbb, r.dbd, r.dba, r.dbc, r.dau, r.daw || '',
    r.day, r.daz || '', `"${r.dag}"`, r.dai, r.dak, r.iin,
    r.dcf, r.dcg, r.dda, r.dca || ''
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

export function exportDatasetAsRawAAMVA(records: AAMVAData[]): string {
  return records.map((r, idx) => {
    const raw = compileAAMVAString(r);
    return `=== RECORD #${idx + 1}: ${r.daj} - ${r.daq} (${r.dcs}, ${r.dac}) ===\n${raw}`;
  }).join('\n\n');
}

// --------------------------------------------------------------------------
// MODULAR SINGLE-FIELD GENERATOR HELPERS (For direct Client Portal 1-Click buttons)
// --------------------------------------------------------------------------

export function generateSingleDLN(stateCode?: string): string {
  const code = (stateCode && JURISDICTION_RULES[stateCode.toUpperCase()]) ? stateCode.toUpperCase() : 'CA';
  return generateStateDLN(code);
}

export function generateSingleDOB(dateMode: 'MMDDYYYY' | 'YYYYMMDD' = 'MMDDYYYY'): string {
  const today = new Date();
  const ageYears = randomInt(19, 68);
  const birthYear = today.getFullYear() - ageYears;
  const birthMonth = randomInt(0, 11);
  const birthDay = randomInt(1, birthMonth === 1 ? 28 : (birthMonth in [3, 5, 8, 10] ? 30 : 31));
  const d = new Date(birthYear, birthMonth, birthDay);

  const y = d.getFullYear().toString();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return dateMode === 'YYYYMMDD' ? `${y}${m}${day}` : `${m}${day}${y}`;
}

export function generateSingleIssueDate(
  dobStr?: string,
  stateCode?: string,
  dateMode: 'MMDDYYYY' | 'YYYYMMDD' = 'MMDDYYYY'
): string {
  const code = (stateCode && JURISDICTION_RULES[stateCode.toUpperCase()]) ? stateCode.toUpperCase() : 'CA';
  const rule = JURISDICTION_RULES[code] || JURISDICTION_RULES['CA'];
  const today = new Date();
  const renewalYears = rule.renewalYears || 5;

  let minIssueTime = today.getTime() - (renewalYears - 0.25) * 365.25 * 24 * 3600 * 1000;

  if (dobStr && dobStr.length === 8) {
    let birthYear = parseInt(dobStr.slice(4, 8), 10);
    let birthMonth = parseInt(dobStr.slice(0, 2), 10) - 1;
    let birthDay = parseInt(dobStr.slice(2, 4), 10);
    if (dobStr.startsWith('19') || dobStr.startsWith('20')) {
      // YYYYMMDD
      birthYear = parseInt(dobStr.slice(0, 4), 10);
      birthMonth = parseInt(dobStr.slice(4, 6), 10) - 1;
      birthDay = parseInt(dobStr.slice(6, 8), 10);
    }
    const minAge16 = new Date(birthYear + (rule.minIssueAge || 16), birthMonth, birthDay).getTime();
    minIssueTime = Math.max(minIssueTime, minAge16);
  }

  const issueTime = randomInt(
    Math.min(minIssueTime, today.getTime() - 14 * 24 * 3600 * 1000),
    today.getTime()
  );
  const d = new Date(issueTime);

  const y = d.getFullYear().toString();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return dateMode === 'YYYYMMDD' ? `${y}${m}${day}` : `${m}${day}${y}`;
}

export function generateSingleExpiryDate(
  dobStr?: string,
  issueStr?: string,
  stateCode?: string,
  dateMode: 'MMDDYYYY' | 'YYYYMMDD' = 'MMDDYYYY'
): string {
  const code = (stateCode && JURISDICTION_RULES[stateCode.toUpperCase()]) ? stateCode.toUpperCase() : 'CA';
  const rule = JURISDICTION_RULES[code] || JURISDICTION_RULES['CA'];
  const today = new Date();
  const renewalYears = rule.renewalYears || 5;

  let birthMonth = randomInt(0, 11);
  let birthDay = randomInt(1, 28);

  if (dobStr && dobStr.length === 8) {
    if (dobStr.startsWith('19') || dobStr.startsWith('20')) {
      birthMonth = parseInt(dobStr.slice(4, 6), 10) - 1;
      birthDay = parseInt(dobStr.slice(6, 8), 10);
    } else {
      birthMonth = parseInt(dobStr.slice(0, 2), 10) - 1;
      birthDay = parseInt(dobStr.slice(2, 4), 10);
    }
  }

  let baseYear = today.getFullYear() + renewalYears;
  if (issueStr && issueStr.length === 8) {
    const issueYear = (issueStr.startsWith('19') || issueStr.startsWith('20'))
      ? parseInt(issueStr.slice(0, 4), 10)
      : parseInt(issueStr.slice(4, 8), 10);
    baseYear = issueYear + renewalYears;
  }

  let expDate = new Date(baseYear, birthMonth, birthDay);
  while (expDate.getTime() <= today.getTime()) {
    baseYear += renewalYears;
    expDate = new Date(baseYear, birthMonth, birthDay);
  }

  const y = expDate.getFullYear().toString();
  const m = (expDate.getMonth() + 1).toString().padStart(2, '0');
  const day = expDate.getDate().toString().padStart(2, '0');
  return dateMode === 'YYYYMMDD' ? `${y}${m}${day}` : `${m}${day}${y}`;
}

export function generateSingleICN(stateCode?: string): string {
  const code = (stateCode && JURISDICTION_RULES[stateCode.toUpperCase()]) ? stateCode.toUpperCase() : 'CA';
  const year = new Date().getFullYear();
  return `${code}${year}${randomDigits(7)}`;
}

export function generateSingleDCF(): string {
  const year = new Date().getFullYear();
  return `${randomDigits(8)}${year}${randomChars(6, '0123456789ABCDEF')}`;
}

export function generateSingleAddress(stateCode?: string): { dag: string; dai: string; dak: string; daj: string } {
  const code = (stateCode && JURISDICTION_RULES[stateCode.toUpperCase()]) ? stateCode.toUpperCase() : 'CA';
  const rule = JURISDICTION_RULES[code] || JURISDICTION_RULES['CA'];
  const streetNum = randomInt(100, 9999);
  const streetName = randomChoice(STREET_NAMES);
  const cityZip = randomChoice(rule.citiesZips);

  return {
    dag: `${streetNum} ${streetName}`,
    dai: cityZip.city,
    dak: cityZip.zip,
    daj: code
  };
}

export function generateSingleName(genderPref?: string): { dcs: string; dac: string; dad: string; dbc: string } {
  const isMale = genderPref === '1' ? true : (genderPref === '2' ? false : Math.random() > 0.5);
  const firstName = randomChoice(isMale ? FIRST_NAMES_MALE : FIRST_NAMES_FEMALE);
  const middleName = Math.random() > 0.3 ? randomChoice(isMale ? FIRST_NAMES_MALE : FIRST_NAMES_FEMALE) : '';
  const lastName = randomChoice(LAST_NAMES);

  return {
    dcs: lastName,
    dac: firstName,
    dad: middleName,
    dbc: isMale ? '1' : '2'
  };
}

