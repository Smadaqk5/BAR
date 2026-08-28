#!/usr/bin/env python3
"""
AAMVA Synthetic Driver's License & ID Card Record Generator
============================================================
A robust, standalone Python engine to generate high-fidelity synthetic driver's
license records adhering to the AAMVA (American Association of Motor Vehicle
Administrators) DL/ID Card Design Standard.

Designed for:
  - Mock testing and synthetic test fixtures
  - Form validation & regex benchmark suites
  - PDF417 2D barcode parser benchmarking

Covers all 50 US States + District of Columbia (DC) with exact DLN pattern masks,
AAMVA Issuer Identification Numbers (IIN), realistic Document Discriminators (DCF),
Inventory Control Numbers (DCG), demographic profiles, and strict chronological
date validation.
"""

import argparse
import csv
import datetime
import json
import random
import re
import sys
from dataclasses import asdict, dataclass
from typing import Any, Dict, List, Optional, Tuple


# ==============================================================================
# JURISDICTION REGISTRY & AAMVA CONFIGURATION (ALL 50 STATES + DC)
# ==============================================================================

@dataclass(frozen=True)
class StateRule:
    code: str
    name: str
    iin: str
    renewal_years: int
    dln_regex: str
    dln_format_desc: str
    cities_zips: List[Tuple[str, str]]
    min_issue_age: int = 16


# Comprehensive lookup dictionary for all 50 US States + DC
STATE_RULES: Dict[str, StateRule] = {
    'AL': StateRule(
        code='AL', name='Alabama', iin='636033', renewal_years=4,
        dln_regex=r'^\d{7,8}$', dln_format_desc='7-8 Digits',
        cities_zips=[('BIRMINGHAM', '35203'), ('MONTGOMERY', '36104'), ('HUNTSVILLE', '35801'), ('MOBILE', '36602')]
    ),
    'AK': StateRule(
        code='AK', name='Alaska', iin='636059', renewal_years=5,
        dln_regex=r'^\d{7}$', dln_format_desc='7 Digits',
        cities_zips=[('ANCHORAGE', '99501'), ('FAIRBANKS', '99701'), ('JUNEAU', '99801'), ('SITKA', '99835')]
    ),
    'AZ': StateRule(
        code='AZ', name='Arizona', iin='636026', renewal_years=5,
        dln_regex=r'^[A-Z]\d{8}$', dln_format_desc='1 Letter + 8 Digits',
        cities_zips=[('PHOENIX', '85001'), ('TUCSON', '85701'), ('MESA', '85201'), ('SCOTTSDALE', '85251')]
    ),
    'AR': StateRule(
        code='AR', name='Arkansas', iin='636021', renewal_years=8,
        dln_regex=r'^\d{9}$', dln_format_desc='9 Digits',
        cities_zips=[('LITTLE ROCK', '72201'), ('FORT SMITH', '72901'), ('FAYETTEVILLE', '72701'), ('SPRINGDALE', '72764')]
    ),
    'CA': StateRule(
        code='CA', name='California', iin='636014', renewal_years=5,
        dln_regex=r'^[A-Z]\d{7}$', dln_format_desc='1 Letter + 7 Digits',
        cities_zips=[('LOS ANGELES', '90012'), ('SAN FRANCISCO', '94102'), ('SAN DIEGO', '92101'), ('SACRAMENTO', '95814')]
    ),
    'CO': StateRule(
        code='CO', name='Colorado', iin='636020', renewal_years=5,
        dln_regex=r'^\d{9}$', dln_format_desc='9 Digits',
        cities_zips=[('DENVER', '80202'), ('COLORADO SPRINGS', '80903'), ('AURORA', '80012'), ('BOULDER', '80302')]
    ),
    'CT': StateRule(
        code='CT', name='Connecticut', iin='636006', renewal_years=6,
        dln_regex=r'^\d{9}$', dln_format_desc='9 Digits',
        cities_zips=[('HARTFORD', '06103'), ('NEW HAVEN', '06510'), ('STAMFORD', '06901'), ('BRIDGEPORT', '06604')]
    ),
    'DE': StateRule(
        code='DE', name='Delaware', iin='636011', renewal_years=8,
        dln_regex=r'^\d{7}$', dln_format_desc='7 Digits',
        cities_zips=[('WILMINGTON', '19801'), ('DOVER', '19901'), ('NEWARK', '19711'), ('MIDDLETOWN', '19709')]
    ),
    'DC': StateRule(
        code='DC', name='District of Columbia', iin='636043', renewal_years=8,
        dln_regex=r'^\d{7}$', dln_format_desc='7 Digits',
        cities_zips=[('WASHINGTON', '20001'), ('WASHINGTON', '20005'), ('WASHINGTON', '20009'), ('WASHINGTON', '20019')]
    ),
    'FL': StateRule(
        code='FL', name='Florida', iin='636010', renewal_years=8,
        dln_regex=r'^[A-Z]\d{12}$', dln_format_desc='1 Letter + 12 Digits (Soundex)',
        cities_zips=[('MIAMI', '33101'), ('ORLANDO', '32801'), ('TAMPA', '33602'), ('JACKSONVILLE', '32202')]
    ),
    'GA': StateRule(
        code='GA', name='Georgia', iin='636055', renewal_years=8,
        dln_regex=r'^\d{9}$', dln_format_desc='9 Digits',
        cities_zips=[('ATLANTA', '30303'), ('SAVANNAH', '31401'), ('AUGUSTA', '30901'), ('COLUMBUS', '31901')]
    ),
    'HI': StateRule(
        code='HI', name='Hawaii', iin='636047', renewal_years=8,
        dln_regex=r'^[A-Z]\d{8}$', dln_format_desc='1 Letter (H) + 8 Digits',
        cities_zips=[('HONOLULU', '96813'), ('HILO', '96720'), ('KAILUA', '96734'), ('KAPOLEI', '96707')]
    ),
    'ID': StateRule(
        code='ID', name='Idaho', iin='636050', renewal_years=8,
        dln_regex=r'^[A-Z]{2}\d{6}[A-Z]$', dln_format_desc='2 Letters + 6 Digits + 1 Letter',
        cities_zips=[('BOISE', '83702'), ('MERIDIAN', '83642'), ('NAMPA', '83651'), ('IDAHO FALLS', '83401')]
    ),
    'IL': StateRule(
        code='IL', name='Illinois', iin='636035', renewal_years=4,
        dln_regex=r'^[A-Z]\d{11}$', dln_format_desc='1 Letter + 11 Digits',
        cities_zips=[('CHICAGO', '60601'), ('SPRINGFIELD', '62701'), ('NAPERVILLE', '60540'), ('PEORIA', '61602')]
    ),
    'IN': StateRule(
        code='IN', name='Indiana', iin='636037', renewal_years=6,
        dln_regex=r'^\d{10}$', dln_format_desc='10 Digits',
        cities_zips=[('INDIANAPOLIS', '46204'), ('FORT WAYNE', '46802'), ('EVANSVILLE', '47708'), ('SOUTH BEND', '46601')]
    ),
    'IA': StateRule(
        code='IA', name='Iowa', iin='636018', renewal_years=8,
        dln_regex=r'^\d{9}$', dln_format_desc='9 Digits',
        cities_zips=[('DES MOINES', '50309'), ('CEDAR RAPIDS', '52401'), ('DAVENPORT', '52801'), ('IOWA CITY', '52240')]
    ),
    'KS': StateRule(
        code='KS', name='Kansas', iin='636022', renewal_years=6,
        dln_regex=r'^K\d{8}$', dln_format_desc='Letter K + 8 Digits',
        cities_zips=[('WICHITA', '67202'), ('OVERLAND PARK', '66212'), ('TOPEKA', '66603'), ('OLATHE', '66061')]
    ),
    'KY': StateRule(
        code='KY', name='Kentucky', iin='636046', renewal_years=8,
        dln_regex=r'^[A-Z]\d{8}$', dln_format_desc='1 Letter + 8 Digits',
        cities_zips=[('LOUISVILLE', '40202'), ('LEXINGTON', '40507'), ('BOWLING GREEN', '42101'), ('FRANKFORT', '40601')]
    ),
    'LA': StateRule(
        code='LA', name='Louisiana', iin='636007', renewal_years=6,
        dln_regex=r'^00\d{7}$', dln_format_desc='Prefix 00 + 7 Digits (9 Digits Total)',
        cities_zips=[('NEW ORLEANS', '70112'), ('BATON ROUGE', '70802'), ('SHREVEPORT', '71101'), ('LAFAYETTE', '70501')]
    ),
    'ME': StateRule(
        code='ME', name='Maine', iin='636041', renewal_years=6,
        dln_regex=r'^\d{7}$', dln_format_desc='7 Digits',
        cities_zips=[('PORTLAND', '04101'), ('AUGUSTA', '04330'), ('BANGOR', '04401'), ('LEWISTON', '04240')]
    ),
    'MD': StateRule(
        code='MD', name='Maryland', iin='636003', renewal_years=8,
        dln_regex=r'^[A-Z]\d{12}$', dln_format_desc='1 Letter + 12 Digits (Soundex)',
        cities_zips=[('BALTIMORE', '21201'), ('ANNAPOLIS', '21401'), ('ROCKVILLE', '20850'), ('SILVER SPRING', '20910')]
    ),
    'MA': StateRule(
        code='MA', name='Massachusetts', iin='636002', renewal_years=5,
        dln_regex=r'^S\d{8}$', dln_format_desc='Letter S + 8 Digits',
        cities_zips=[('BOSTON', '02108'), ('WORCESTER', '01608'), ('SPRINGFIELD', '01103'), ('CAMBRIDGE', '02138')]
    ),
    'MI': StateRule(
        code='MI', name='Michigan', iin='636032', renewal_years=4,
        dln_regex=r'^[A-Z]\d{12}$', dln_format_desc='1 Letter + 12 Digits',
        cities_zips=[('DETROIT', '48226'), ('GRAND RAPIDS', '49503'), ('LANSING', '48933'), ('ANN ARBOR', '48104')]
    ),
    'MN': StateRule(
        code='MN', name='Minnesota', iin='636038', renewal_years=4,
        dln_regex=r'^[A-Z]\d{12}$', dln_format_desc='1 Letter + 12 Digits',
        cities_zips=[('MINNEAPOLIS', '55401'), ('SAINT PAUL', '55101'), ('ROCHESTER', '55901'), ('DULUTH', '55802')]
    ),
    'MS': StateRule(
        code='MS', name='Mississippi', iin='636051', renewal_years=8,
        dln_regex=r'^\d{9}$', dln_format_desc='9 Digits',
        cities_zips=[('JACKSON', '39201'), ('GULFPORT', '39501'), ('SOUTHAVEN', '38671'), ('BILOXI', '39530')]
    ),
    'MO': StateRule(
        code='MO', name='Missouri', iin='636030', renewal_years=6,
        dln_regex=r'^[A-Z]\d{9}$', dln_format_desc='1 Letter + 9 Digits',
        cities_zips=[('KANSAS CITY', '64106'), ('SAINT LOUIS', '63101'), ('SPRINGFIELD', '65806'), ('COLUMBIA', '65201')]
    ),
    'MT': StateRule(
        code='MT', name='Montana', iin='636008', renewal_years=8,
        dln_regex=r'^[A-Z]\d{8}$', dln_format_desc='1 Letter + 8 Digits',
        cities_zips=[('BILLINGS', '59101'), ('MISSOULA', '59801'), ('HELENA', '59601'), ('BOZEMAN', '59715')]
    ),
    'NE': StateRule(
        code='NE', name='Nebraska', iin='636054', renewal_years=5,
        dln_regex=r'^[A-Z]\d{8}$', dln_format_desc='1 Letter + 8 Digits',
        cities_zips=[('OMAHA', '68102'), ('LINCOLN', '68508'), ('BELLEVUE', '68005'), ('GRAND ISLAND', '68801')]
    ),
    'NV': StateRule(
        code='NV', name='Nevada', iin='636049', renewal_years=8,
        dln_regex=r'^\d{10}$', dln_format_desc='10 Digits',
        cities_zips=[('LAS VEGAS', '89101'), ('RENO', '89501'), ('HENDERSON', '89015'), ('CARSON CITY', '89701')]
    ),
    'NH': StateRule(
        code='NH', name='New Hampshire', iin='636039', renewal_years=5,
        dln_regex=r'^\d{2}[A-Z]{3}\d{5}$', dln_format_desc='2 Digits + 3 Letters + 5 Digits',
        cities_zips=[('MANCHESTER', '03101'), ('NASHUA', '03060'), ('CONCORD', '03301'), ('PORTSMOUTH', '03801')]
    ),
    'NJ': StateRule(
        code='NJ', name='New Jersey', iin='636036', renewal_years=4,
        dln_regex=r'^[A-Z]\d{14}$', dln_format_desc='1 Letter + 14 Digits',
        cities_zips=[('NEWARK', '07102'), ('JERSEY CITY', '07302'), ('PATERSON', '07505'), ('TRENTON', '08608')]
    ),
    'NM': StateRule(
        code='NM', name='New Mexico', iin='636009', renewal_years=8,
        dln_regex=r'^\d{9}$', dln_format_desc='9 Digits',
        cities_zips=[('ALBUQUERQUE', '87102'), ('SANTA FE', '87501'), ('LAS CRUCES', '88001'), ('RIO RANCHO', '87124')]
    ),
    'NY': StateRule(
        code='NY', name='New York', iin='636001', renewal_years=8,
        dln_regex=r'^[A-Z]\d{7}$', dln_format_desc='1 Letter + 7 Digits or 9 Digits',
        cities_zips=[('NEW YORK', '10001'), ('BUFFALO', '14202'), ('ROCHESTER', '14604'), ('ALBANY', '12207')]
    ),
    'NC': StateRule(
        code='NC', name='North Carolina', iin='636004', renewal_years=8,
        dln_regex=r'^\d{10}$', dln_format_desc='10 Digits',
        cities_zips=[('CHARLOTTE', '28202'), ('RALEIGH', '27601'), ('GREENSBORO', '27401'), ('DURHAM', '27701')]
    ),
    'ND': StateRule(
        code='ND', name='North Dakota', iin='636034', renewal_years=6,
        dln_regex=r'^[A-Z]{3}\d{6}$', dln_format_desc='3 Letters + 6 Digits',
        cities_zips=[('FARGO', '58102'), ('BISMARCK', '58501'), ('GRAND FORKS', '58201'), ('MINOT', '58701')]
    ),
    'OH': StateRule(
        code='OH', name='Ohio', iin='636023', renewal_years=4,
        dln_regex=r'^[A-Z]{2}\d{6}$', dln_format_desc='2 Letters + 6 Digits',
        cities_zips=[('COLUMBUS', '43215'), ('CLEVELAND', '44114'), ('CINCINNATI', '45202'), ('TOLEDO', '43604')]
    ),
    'OK': StateRule(
        code='OK', name='Oklahoma', iin='636058', renewal_years=8,
        dln_regex=r'^[A-Z]\d{9}$', dln_format_desc='1 Letter + 9 Digits',
        cities_zips=[('OKLAHOMA CITY', '73102'), ('TULSA', '74103'), ('NORMAN', '73069'), ('BROKEN ARROW', '74012')]
    ),
    'OR': StateRule(
        code='OR', name='Oregon', iin='636029', renewal_years=8,
        dln_regex=r'^\d{7}$', dln_format_desc='7 Digits',
        cities_zips=[('PORTLAND', '97201'), ('SALEM', '97301'), ('EUGENE', '97401'), ('BEND', '97701')]
    ),
    'PA': StateRule(
        code='PA', name='Pennsylvania', iin='636025', renewal_years=4,
        dln_regex=r'^\d{8}$', dln_format_desc='8 Digits',
        cities_zips=[('PHILADELPHIA', '19107'), ('PITTSBURGH', '15219'), ('ALLENTOWN', '18101'), ('HARRISBURG', '17101')]
    ),
    'RI': StateRule(
        code='RI', name='Rhode Island', iin='636052', renewal_years=5,
        dln_regex=r'^\d{7}$', dln_format_desc='7 Digits',
        cities_zips=[('PROVIDENCE', '02903'), ('WARWICK', '02886'), ('CRANSTON', '02910'), ('NEWPORT', '02840')]
    ),
    'SC': StateRule(
        code='SC', name='South Carolina', iin='636005', renewal_years=8,
        dln_regex=r'^\d{9}$', dln_format_desc='9 Digits',
        cities_zips=[('CHARLESTON', '29401'), ('COLUMBIA', '29201'), ('GREENVILLE', '29601'), ('MYRTLE BEACH', '29577')]
    ),
    'SD': StateRule(
        code='SD', name='South Dakota', iin='636042', renewal_years=5,
        dln_regex=r'^\d{8}$', dln_format_desc='8 Digits',
        cities_zips=[('SIOUX FALLS', '57104'), ('RAPID CITY', '57701'), ('ABERDEEN', '57401'), ('PIERRE', '57501')]
    ),
    'TN': StateRule(
        code='TN', name='Tennessee', iin='636053', renewal_years=8,
        dln_regex=r'^\d{8,9}$', dln_format_desc='8-9 Digits',
        cities_zips=[('NASHVILLE', '37203'), ('MEMPHIS', '38103'), ('KNOXVILLE', '37902'), ('CHATTANOOGA', '37402')]
    ),
    'TX': StateRule(
        code='TX', name='Texas', iin='636015', renewal_years=8,
        dln_regex=r'^\d{8}$', dln_format_desc='8 Digits',
        cities_zips=[('HOUSTON', '77002'), ('AUSTIN', '78701'), ('DALLAS', '75201'), ('SAN ANTONIO', '78205')]
    ),
    'UT': StateRule(
        code='UT', name='Utah', iin='636040', renewal_years=8,
        dln_regex=r'^\d{9}$', dln_format_desc='9 Digits',
        cities_zips=[('SALT LAKE CITY', '84101'), ('PROVO', '84601'), ('WEST VALLEY CITY', '84119'), ('OGDEN', '84401')]
    ),
    'VT': StateRule(
        code='VT', name='Vermont', iin='636024', renewal_years=4,
        dln_regex=r'^\d{8}$', dln_format_desc='8 Digits',
        cities_zips=[('BURLINGTON', '05401'), ('MONTPELIER', '05602'), ('RUTLAND', '05701'), ('SOUTH BURLINGTON', '05403')]
    ),
    'VA': StateRule(
        code='VA', name='Virginia', iin='636000', renewal_years=8,
        dln_regex=r'^[A-Z]\d{8}$', dln_format_desc='1 Letter + 8 Digits',
        cities_zips=[('RICHMOND', '23219'), ('VIRGINIA BEACH', '23451'), ('NORFOLK', '23510'), ('ALEXANDRIA', '22314')]
    ),
    'WA': StateRule(
        code='WA', name='Washington', iin='636045', renewal_years=6,
        dln_regex=r'^[A-Z0-9]{12}$', dln_format_desc='12 Alphanumeric (WDL Soundex format)',
        cities_zips=[('SEATTLE', '98101'), ('SPOKANE', '99201'), ('TACOMA', '98402'), ('OLYMPIA', '98501')]
    ),
    'WV': StateRule(
        code='WV', name='West Virginia', iin='636061', renewal_years=5,
        dln_regex=r'^[A-Z]\d{6}$', dln_format_desc='1 Letter + 6 Digits',
        cities_zips=[('CHARLESTON', '25301'), ('HUNTINGTON', '25701'), ('MORGANTOWN', '26505'), ('PARKERSBURG', '26101')]
    ),
    'WI': StateRule(
        code='WI', name='Wisconsin', iin='636031', renewal_years=8,
        dln_regex=r'^[A-Z]\d{13}$', dln_format_desc='1 Letter + 13 Digits',
        cities_zips=[('MILWAUKEE', '53202'), ('MADISON', '53703'), ('GREEN BAY', '54301'), ('KENOSHA', '53140')]
    ),
    'WY': StateRule(
        code='WY', name='Wyoming', iin='636060', renewal_years=5,
        dln_regex=r'^\d{9}$', dln_format_desc='9 Digits',
        cities_zips=[('CHEYENNE', '82001'), ('CASPER', '82601'), ('LARAMIE', '82070'), ('JACKSON', '83001')]
    ),
}

# ==============================================================================
# DEMOGRAPHIC POOLS
# ==============================================================================

FIRST_NAMES_MALE = [
    'JAMES', 'ROBERT', 'JOHN', 'MICHAEL', 'DAVID', 'WILLIAM', 'RICHARD', 'JOSEPH',
    'THOMAS', 'CHARLES', 'CHRISTOPHER', 'DANIEL', 'MATTHEW', 'ANTHONY', 'MARK',
    'DONALD', 'STEVEN', 'ANDREW', 'PAUL', 'JOSHUA', 'KENNETH', 'KEVIN', 'BRIAN',
    'GEORGE', 'TIMOTHY', 'RONALD', 'JASON', 'EDWARD', 'JEFFREY', 'RYAN', 'JACOB',
    'GARY', 'NICHOLAS', 'ERIC', 'JONATHAN', 'STEPHEN', 'LARRY', 'JUSTIN', 'SCOTT',
    'BRANDON', 'BENJAMIN', 'SAMUEL', 'GREGORY', 'ALEXANDER', 'PATRICK', 'FRANK'
]

FIRST_NAMES_FEMALE = [
    'MARY', 'PATRICIA', 'JENNIFER', 'LINDA', 'ELIZABETH', 'BARBARA', 'SUSAN',
    'JESSICA', 'SARAH', 'KAREN', 'LISA', 'NANCY', 'BETTY', 'MARGARET', 'SANDRA',
    'ASHLEY', 'KIMBERLY', 'EMILY', 'DONNA', 'MICHELLE', 'CAROL', 'AMANDA', 'MELISSA',
    'DEBORAH', 'STEPHANIE', 'REBECCA', 'SHARON', 'LAURA', 'CYNTHIA', 'KATHLEEN',
    'AMY', 'ANGELA', 'SHIRLEY', 'ANNA', 'BRENDA', 'PAMELA', 'EMMA', 'NICOLE',
    'HELEN', 'SAMANTHA', 'KATHERINE', 'CHRISTINE', 'DEBRA', 'RACHEL', 'CAROLYN'
]

LAST_NAMES = [
    'SMITH', 'JOHNSON', 'WILLIAMS', 'BROWN', 'JONES', 'GARCIA', 'MILLER', 'DAVIS',
    'RODRIGUEZ', 'MARTINEZ', 'HERNANDEZ', 'LOPEZ', 'GONZALEZ', 'WILSON', 'ANDERSON',
    'THOMAS', 'TAYLOR', 'MOORE', 'JACKSON', 'MARTIN', 'LEE', 'PEREZ', 'THOMPSON',
    'WHITE', 'HARRIS', 'SANCHEZ', 'CLARK', 'RAMIREZ', 'LEWIS', 'ROBINSON', 'WALKER',
    'YOUNG', 'ALLEN', 'KING', 'WRIGHT', 'SCOTT', 'TORRES', 'NGUYEN', 'HILL', 'FLORES',
    'GREEN', 'ADAMS', 'NELSON', 'BAKER', 'HALL', 'RIVERA', 'CAMPBELL', 'MITCHELL'
]

STREET_NAMES = [
    'MAIN ST', 'OAK AVE', 'MAPLE DR', 'CEDAR LN', 'WASHINGTON BLVD', 'LINCOLN WAY',
    'PINE ST', 'ELM ST', 'PARK AVE', 'LAKE RD', 'RIDGE WAY', 'SUNSET DR', 'BROADWAY',
    'HIGHLAND AVE', 'VALLEY VIEW RD', 'MEADOW LN', 'COLLEGE AVE', 'SPRING ST', 'FOREST DR'
]

EYE_COLORS = ['BRO', 'BLU', 'GRN', 'HAZ', 'GRY', 'BLK']
HAIR_COLORS = ['BRO', 'BLK', 'BLN', 'RED', 'GRY', 'WHI', 'BAL']
RACE_CODES = ['W', 'B', 'A', 'H', 'I', 'U']
VEHICLE_CLASSES = ['C', 'D', 'A', 'B', 'M']


# ==============================================================================
# SYNTHETIC VALUE GENERATORS
# ==============================================================================

def generate_state_dln(state_code: str) -> str:
    """Generates a high-fidelity synthetic Driver License Number (DAQ) matching jurisdiction rules."""
    rule = STATE_RULES.get(state_code)
    if not rule:
        return f"{random.randint(10000000, 99999999)}"

    code = rule.code
    # State-specific mask synthesis
    if code in ('AL', 'DE', 'DC', 'ME', 'OR', 'RI', 'AK'):
        # 7-digit numeric
        return f"{random.randint(1000000, 9999999)}"
    elif code in ('AR', 'CO', 'CT', 'GA', 'IA', 'MS', 'NM', 'SC', 'UT', 'WY'):
        # 9-digit numeric
        return f"{random.randint(100000000, 999999999)}"
    elif code in ('IN', 'NV', 'NC'):
        # 10-digit numeric
        return f"{random.randint(1000000000, 9999999999)}"
    elif code in ('PA', 'TX', 'VT', 'SD'):
        # 8-digit numeric
        return f"{random.randint(10000000, 99999999)}"
    elif code == 'TN':
        return f"{random.randint(10000000, 99999999)}"
    elif code == 'LA':
        return f"00{random.randint(1000000, 9999999)}"
    elif code == 'CA':
        # 1 Letter + 7 Digits
        letter = random.choice('ABCDEFGHJKLMNPRSTUVWXYZ')
        return f"{letter}{random.randint(1000000, 9999999)}"
    elif code in ('AZ', 'KY', 'MT', 'NE', 'VA'):
        # 1 Letter + 8 Digits
        letter = random.choice('ABCDEFGHJKLMNPRSTUVWXYZ')
        return f"{letter}{random.randint(10000000, 99999999)}"
    elif code == 'HI':
        return f"H{random.randint(10000000, 99999999)}"
    elif code == 'KS':
        return f"K{random.randint(10000000, 99999999)}"
    elif code == 'MA':
        return f"S{random.randint(10000000, 99999999)}"
    elif code == 'MO':
        letter = random.choice('ABCDEFGHJKLMNPRSTUVWXYZ')
        return f"{letter}{random.randint(100000000, 999999999)}"
    elif code == 'IL':
        # 1 Letter + 11 Digits
        letter = random.choice('ABCDEFGHJKLMNPRSTUVWXYZ')
        return f"{letter}{random.randint(10000000000, 99999999999)}"
    elif code in ('FL', 'MD', 'MI', 'MN'):
        # 1 Letter + 12 Digits
        letter = random.choice('ABCDEFGHJKLMNPRSTUVWXYZ')
        return f"{letter}{random.randint(100000000000, 999999999999)}"
    elif code == 'NJ':
        # 1 Letter + 14 Digits
        letter = random.choice('ABCDEFGHJKLMNPRSTUVWXYZ')
        return f"{letter}{random.randint(10000000000000, 99999999999999)}"
    elif code == 'WI':
        # 1 Letter + 13 Digits
        letter = random.choice('ABCDEFGHJKLMNPRSTUVWXYZ')
        return f"{letter}{random.randint(1000000000000, 9999999999999)}"
    elif code == 'WV':
        # 1 Letter + 6 Digits
        letter = random.choice('ABCDEFGHJKLMNPRSTUVWXYZ')
        return f"{letter}{random.randint(100000, 999999)}"
    elif code == 'NY':
        # 1 Letter + 7 Digits
        letter = random.choice('ABCDEFGHJKLMNPRSTUVWXYZ')
        return f"{letter}{random.randint(1000000, 9999999)}"
    elif code == 'OK':
        letter = random.choice('ABCDEFGHJKLMNPRSTUVWXYZ')
        return f"{letter}{random.randint(100000000, 999999999)}"
    elif code == 'OH':
        # 2 Letters + 6 Digits
        letters = "".join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ', k=2))
        return f"{letters}{random.randint(100000, 999999)}"
    elif code == 'ND':
        # 3 Letters + 6 Digits
        letters = "".join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ', k=3))
        return f"{letters}{random.randint(100000, 999999)}"
    elif code == 'ID':
        # 2 Letters + 6 Digits + 1 Letter
        pre = "".join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ', k=2))
        suf = random.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
        return f"{pre}{random.randint(100000, 999999)}{suf}"
    elif code == 'NH':
        # 2 Digits + 3 Letters + 5 Digits
        digits_pre = f"{random.randint(10, 99)}"
        letters = "".join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ', k=3))
        digits_suf = f"{random.randint(10000, 99999)}"
        return f"{digits_pre}{letters}{digits_suf}"
    elif code == 'WA':
        # 12 alphanumeric
        chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789'
        return f"WDL{''.join(random.choices(chars, k=9))}"
    else:
        return f"{random.randint(10000000, 99999999)}"


def generate_document_discriminator(state_code: str, issue_year: int) -> str:
    """Generates a realistic AAMVA Field DCF (Document Discriminator / Audit Code)."""
    charset = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ'
    audit_num = "".join(random.choices('0123456789', k=8))
    stock_code = "".join(random.choices(charset, k=6))
    return f"{audit_num}{issue_year}{stock_code}"


def generate_inventory_control_number(state_code: str, issue_year: int) -> str:
    """Generates a realistic AAMVA Field DCG (Inventory Control Number / Serial)."""
    serial = "".join(random.choices('0123456789', k=7))
    return f"{state_code}{issue_year}{serial}"


def generate_height_fii() -> Tuple[str, int, int]:
    """Generates realistic height in AAMVA Feet & Inches code (DAU) and raw ft/in."""
    feet = random.choice([5, 5, 5, 5, 6, 6, 6, 4])
    if feet == 4:
        inches = random.randint(10, 11)
    elif feet == 6:
        inches = random.randint(0, 5)
    else:
        inches = random.randint(0, 11)
    dau = f"{feet}{inches:02d}"
    return dau, feet, inches


# ==============================================================================
# DATE CALCULATOR WITH STRICT AAMVA CHRONOLOGICAL INTEGRITY
# ==============================================================================

def generate_chronological_dates(
    state_code: str,
    target_date: Optional[datetime.date] = None
) -> Tuple[datetime.date, datetime.date, datetime.date]:
    """
    Computes strict AAMVA-compliant chronological dates:
      1. DOB (DBB) -> Age between 18 and 75 years old.
      2. Issue Date (DBD) -> Logically after 16th/18th birthday, <= today.
      3. Expiration Date (DBA) -> Renewal cycle aligned with driver's birthday, > today.

    Constraint Enforced:
      DOB < Issue Date <= Today < Expiration Date
    """
    today = target_date or datetime.date.today()
    rule = STATE_RULES.get(state_code, STATE_RULES['CA'])

    # 1. Generate DOB (Age 18 to 75)
    age_years = random.randint(18, 75)
    birth_year = today.year - age_years
    birth_month = random.randint(1, 12)
    # Handle month day bounds safely (avoid Feb 29 for standard generation simplicity)
    max_days_in_month = 28 if birth_month == 2 else (30 if birth_month in (4, 6, 9, 11) else 31)
    birth_day = random.randint(1, max_days_in_month)
    dob = datetime.date(birth_year, birth_month, birth_day)

    # 2. Issue Date (DBD)
    # Must be at or after min_issue_age (16 or 18)
    min_issue_date = datetime.date(birth_year + rule.min_issue_age, birth_month, birth_day)
    
    # Active driver's license was issued within the last `renewal_years` (e.g. 4 to 8 years ago)
    # or between min_issue_date and today
    earliest_recent_issue = max(min_issue_date, today - datetime.timedelta(days=int((rule.renewal_years - 0.5) * 365.25)))
    
    # Safe delta days
    delta_days = (today - earliest_recent_issue).days
    if delta_days <= 0:
        issue_date = today - datetime.timedelta(days=random.randint(30, 365))
    else:
        issue_date = earliest_recent_issue + datetime.timedelta(days=random.randint(0, delta_days))

    if issue_date < min_issue_date:
        issue_date = min_issue_date
    if issue_date > today:
        issue_date = today

    # 3. Expiration Date (DBA)
    # Expiration is in the future (> today), set on the driver's birth month/day in the renewal year
    cycle = rule.renewal_years
    # Find next renewal year that produces a future expiration date relative to today
    target_exp_year = issue_date.year + cycle
    
    # Adjust for leap year safety
    exp_day = birth_day
    if birth_month == 2 and birth_day == 29:
        exp_day = 28

    try:
        exp_date = datetime.date(target_exp_year, birth_month, exp_day)
    except ValueError:
        exp_date = datetime.date(target_exp_year, birth_month, 28)

    # Guarantee expiration is strictly in the future
    while exp_date <= today:
        target_exp_year += cycle
        try:
            exp_date = datetime.date(target_exp_year, birth_month, exp_day)
        except ValueError:
            exp_date = datetime.date(target_exp_year, birth_month, 28)

    # Final assertion check
    assert dob < issue_date <= today < exp_date, (
        f"Chronological order failed for {state_code}: "
        f"DOB={dob} < Issue={issue_date} <= Today={today} < Exp={exp_date}"
    )

    return dob, issue_date, exp_date


# ==============================================================================
# COMPLETE SYNTHETIC RECORD MODEL
# ==============================================================================

@dataclass
class SyntheticAAMVARecord:
    # AAMVA Header Data
    file_type: str            # DL or ID
    aamva_version: str        # '10', '09', '08'
    iin: str                  # 6-digit Issuer ID Number
    jvn: str                  # 2-digit Jurisdiction Version ('00')

    # Core Demographic Fields
    dcs_last_name: str        # DCS
    dac_first_name: str       # DAC
    dad_middle_name: str      # DAD
    dbb_date_of_birth: str    # DBB (YYYYMMDD)
    dbc_sex: str              # DBC ('1'=Male, '2'=Female, '9'=Unspecified)
    day_eye_color: str        # DAY (e.g. BRO, BLU)
    daz_hair_color: str       # DAZ (e.g. BLK, BRO)
    dau_height: str           # DAU (e.g. 510, 601)
    daw_weight_lbs: str       # DAW (e.g. 175)

    # Address Fields
    dag_street: str           # DAG
    dai_city: str             # DAI
    daj_state: str            # DAJ
    dak_zip: str              # DAK

    # Document & Credential Fields
    daq_dln: str              # DAQ (State DLN)
    dbd_issue_date: str       # DBD (YYYYMMDD)
    dba_expiration_date: str  # DBA (YYYYMMDD)
    dcf_discriminator: str    # DCF (Document Discriminator)
    dcg_country_icn: str      # DCG (Inventory Control / Country)
    dda_real_id: str          # DDA ('F'=REAL ID Compliant, 'N'=Non-compliant)
    dck_icn_number: str       # DCK (State Inventory Control)

    # Privileges & Metadata
    dca_vehicle_class: str    # DCA
    dcb_restrictions: str     # DCB
    dcd_endorsements: str     # DCD
    dcl_race: str             # DCL
    dde_trunc_last: str       # DDE ('N')
    ddf_trunc_first: str      # DDF ('N')
    ddg_trunc_middle: str     # DDG ('N')

    # Additional metadata for analysis/benchmarks
    age: int = 0
    raw_aamva_payload: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Converts dataclass to serializable dictionary."""
        return asdict(self)


def compile_aamva_subfile_string(record: SyntheticAAMVARecord) -> str:
    """
    Compiles full AAMVA-compliant binary/ASCII payload string
    Format: @[LF][RS][CR]ANSI [IIN][VER][JVN][SUBFILES_COUNT][SUBFILE_TYPE][OFFSET][LENGTH][SUBFILE_BODY]
    """
    subfile = f"{record.file_type}\n"
    
    # Mandatory & standard element ordering
    fields = [
        ('DAQ', record.daq_dln),
        ('DCF', record.dcf_discriminator),
        ('DBD', record.dbd_issue_date),
        ('DBB', record.dbb_date_of_birth),
        ('DBA', record.dba_expiration_date),
        ('DAC', record.dac_first_name),
        ('DDF', record.ddf_trunc_first),
        ('DAD', record.dad_middle_name),
        ('DDG', record.ddg_trunc_middle),
        ('DCS', record.dcs_last_name),
        ('DDE', record.dde_trunc_last),
        ('DAU', record.dau_height),
        ('DBC', record.dbc_sex),
        ('DAY', record.day_eye_color),
        ('DAG', record.dag_street),
        ('DAI', record.dai_city),
        ('DAJ', record.daj_state),
        ('DAK', record.dak_zip),
        ('DCG', record.dcg_country_icn),
        ('DDA', record.dda_real_id),
    ]

    for tag, val in fields:
        subfile += f"{tag}{str(val).strip()}\n"

    # Optional tags
    optional = [
        ('DAZ', record.daz_hair_color),
        ('DAW', record.daw_weight_lbs),
        ('DCK', record.dck_icn_number),
        ('DCL', record.dcl_race),
        ('DCA', record.dca_vehicle_class),
        ('DCB', record.dcb_restrictions),
        ('DCD', record.dcd_endorsements),
    ]
    for tag, val in optional:
        if val and str(val).strip():
            subfile += f"{tag}{str(val).strip()}\n"

    # Header calculations
    iin_padded = str(record.iin).ljust(6, '0')[:6]
    ver_padded = str(record.aamva_version).rjust(2, '0')[:2]
    jvn_padded = str(record.jvn).rjust(2, '0')[:2]
    num_subfiles = '01'
    subfile_type = record.file_type[:2]
    offset = '0031'  # standard 31-byte header length
    length_str = f"{len(subfile):04d}"

    header_prefix = "@\n\x1e\rANSI "
    header = f"{header_prefix}{iin_padded}{ver_padded}{jvn_padded}{num_subfiles}{subfile_type}{offset}{length_str}"
    
    return f"{header}{subfile}"


# ==============================================================================
# SINGLE RECORD SYNTHESIZER
# ==============================================================================

def generate_single_record(
    state_code: str,
    date_format: str = 'YYYYMMDD',
    target_date: Optional[datetime.date] = None
) -> SyntheticAAMVARecord:
    """Generates one fully randomized, compliant synthetic AAMVA record for a given state."""
    rule = STATE_RULES.get(state_code.upper(), STATE_RULES['CA'])
    
    # Sex & Name
    is_male = random.choice([True, False])
    first_name = random.choice(FIRST_NAMES_MALE if is_male else FIRST_NAMES_FEMALE)
    middle_name = random.choice(FIRST_NAMES_MALE if is_male else FIRST_NAMES_FEMALE) if random.random() > 0.15 else ""
    last_name = random.choice(LAST_NAMES)
    sex_code = '1' if is_male else '2'

    # Dates
    dob_dt, issue_dt, exp_dt = generate_chronological_dates(rule.code, target_date=target_date)
    
    if date_format.upper() == 'MMDDYYYY':
        dbb_str = dob_dt.strftime('%m%d%Y')
        dbd_str = issue_dt.strftime('%m%d%Y')
        dba_str = exp_dt.strftime('%m%d%Y')
    else:  # Standard AAMVA YYYYMMDD
        dbb_str = dob_dt.strftime('%Y%m%d')
        dbd_str = issue_dt.strftime('%Y%m%d')
        dba_str = exp_dt.strftime('%Y%m%d')

    # Physical Attributes
    height_code, _, _ = generate_height_fii()
    eye_color = random.choice(EYE_COLORS)
    hair_color = random.choice(HAIR_COLORS)
    weight_lbs = str(random.randint(115, 235))

    # Address & Location
    street_num = random.randint(100, 9999)
    street_name = random.choice(STREET_NAMES)
    street = f"{street_num} {street_name}"
    city, zip_code = random.choice(rule.cities_zips)

    # Identifiers
    dln = generate_state_dln(rule.code)
    dcf = generate_document_discriminator(rule.code, issue_dt.year)
    dcg = generate_inventory_control_number(rule.code, issue_dt.year)
    dck = "".join(random.choices('0123456789', k=10))

    # Real ID & Privileges
    is_real_id = random.random() > 0.15
    real_id_code = 'F' if is_real_id else 'N'
    vehicle_class = random.choice(['C', 'D', 'C', 'C'])
    restrictions = 'NONE' if random.random() > 0.25 else 'B'
    endorsements = 'NONE' if random.random() > 0.20 else 'M'
    race_code = random.choice(RACE_CODES)

    age = (issue_dt - dob_dt).days // 365

    rec = SyntheticAAMVARecord(
        file_type='DL',
        aamva_version='10',
        iin=rule.iin,
        jvn='00',
        dcs_last_name=last_name,
        dac_first_name=first_name,
        dad_middle_name=middle_name,
        dbb_date_of_birth=dbb_str,
        dbc_sex=sex_code,
        day_eye_color=eye_color,
        daz_hair_color=hair_color,
        dau_height=height_code,
        daw_weight_lbs=weight_lbs,
        dag_street=street,
        dai_city=city,
        daj_state=rule.code,
        dak_zip=zip_code,
        daq_dln=dln,
        dbd_issue_date=dbd_str,
        dba_expiration_date=dba_str,
        dcf_discriminator=dcf,
        dcg_country_icn=dcg,
        dda_real_id=real_id_code,
        dck_icn_number=dck,
        dca_vehicle_class=vehicle_class,
        dcb_restrictions=restrictions,
        dcd_endorsements=endorsements,
        dcl_race=race_code,
        dde_trunc_last='N',
        ddf_trunc_first='N',
        ddg_trunc_middle='N',
        age=age
    )
    rec.raw_aamva_payload = compile_aamva_subfile_string(rec)
    return rec


# ==============================================================================
# DATASET GENERATOR FUNCTION
# ==============================================================================

def generate_mock_dataset(
    records_per_state: int = 15,
    states: Optional[List[str]] = None,
    date_format: str = 'YYYYMMDD',
    output_format: str = 'json',
    output_file: Optional[str] = None
) -> List[SyntheticAAMVARecord]:
    """
    Generates a high-fidelity synthetic mock dataset across all jurisdictions.
    
    Args:
        records_per_state: Number of randomized records to generate per state (default: 15).
        states: Optional list of state codes. Defaults to all 50 US States + DC.
        date_format: Format for dates, either 'YYYYMMDD' (AAMVA Standard) or 'MMDDYYYY'.
        output_format: 'json', 'csv', or 'raw'.
        output_file: Optional file path to write results directly to disk.

    Returns:
        List of SyntheticAAMVARecord instances.
    """
    target_states = [s.upper() for s in states] if states else sorted(list(STATE_RULES.keys()))
    dataset: List[SyntheticAAMVARecord] = []

    for state_code in target_states:
        if state_code not in STATE_RULES:
            continue
        for _ in range(records_per_state):
            rec = generate_single_record(state_code, date_format=date_format)
            dataset.append(rec)

    # Optional file serialization
    if output_file:
        if output_format.lower() == 'csv':
            export_to_csv(dataset, output_file)
        elif output_format.lower() == 'raw':
            with open(output_file, 'w', encoding='utf-8') as f:
                for idx, item in enumerate(dataset, start=1):
                    f.write(f"--- RECORD #{idx} ({item.daj_state} - {item.daq_dln}) ---\n")
                    f.write(item.raw_aamva_payload)
                    f.write("\n\n")
        else:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump([r.to_dict() for r in dataset], f, indent=2)

    return dataset


def export_to_csv(records: List[SyntheticAAMVARecord], filename: str) -> None:
    """Exports records to a structured CSV file."""
    if not records:
        return
    fieldnames = [
        'daj_state', 'daq_dln', 'dcs_last_name', 'dac_first_name', 'dad_middle_name',
        'dbb_date_of_birth', 'dbd_issue_date', 'dba_expiration_date', 'dbc_sex',
        'dau_height', 'daw_weight_lbs', 'day_eye_color', 'daz_hair_color',
        'dag_street', 'dai_city', 'dak_zip', 'iin', 'dcf_discriminator',
        'dcg_country_icn', 'dda_real_id', 'dca_vehicle_class', 'aamva_version'
    ]
    with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        for r in records:
            writer.writerow(r.to_dict())


# ==============================================================================
# CONSOLE PREVIEW & BENCHMARK VALIDATOR
# ==============================================================================

def print_console_preview(dataset: List[SyntheticAAMVARecord], sample_count: int = 5) -> None:
    """Prints a beautiful, high-contrast CLI preview table of synthetic records."""
    print("\n" + "=" * 90)
    print(" 🛡️  AAMVA SYNTHETIC DRIVER LICENSE DATASET BENCHMARK PREVIEW")
    print("=" * 90)
    
    # Pick a diverse sample across different states
    samples = dataset[:sample_count] if len(dataset) <= sample_count else random.sample(dataset, sample_count)
    
    header = (
        f"{'ST':<3} | {'IIN':<6} | {'DLN (DAQ)':<15} | {'NAME (DCS, DAC)':<20} | "
        f"{'DOB (DBB)':<9} | {'ISSUE (DBD)':<9} | {'EXP (DBA)':<9} | {'REAL ID':<7}"
    )
    print(header)
    print("-" * 90)

    for r in samples:
        full_name = f"{r.dcs_last_name}, {r.dac_first_name}"[:20]
        row = (
            f"{r.daj_state:<3} | {r.iin:<6} | {r.daq_dln:<15} | {full_name:<20} | "
            f"{r.dbb_date_of_birth:<9} | {r.dbd_issue_date:<9} | {r.dba_expiration_date:<9} | {r.dda_real_id:^7}"
        )
        print(row)

    print("-" * 90)
    print(f"Total Records Generated: {len(dataset)} | Jurisdictions Represented: {len(set(r.daj_state for r in dataset))}")
    print("=" * 90 + "\n")


# ==============================================================================
# CLI ENTRY POINT
# ==============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Generate high-fidelity synthetic AAMVA driver's license records across 50 US States + DC."
    )
    parser.add_argument(
        '-n', '--records-per-state', type=int, default=15,
        help="Number of records to generate per jurisdiction (default: 15)."
    )
    parser.add_argument(
        '-s', '--states', nargs='+', type=str, default=None,
        help="Specific 2-letter state codes to generate (e.g. CA NY TX FL AK). Default: all 50 states + DC."
    )
    parser.add_argument(
        '-f', '--format', choices=['json', 'csv', 'raw'], default='json',
        help="Output dataset format: json, csv, or raw AAMVA barcode text (default: json)."
    )
    parser.add_argument(
        '-o', '--output', type=str, default=None,
        help="File path to save the generated mock dataset."
    )
    parser.add_argument(
        '--date-format', choices=['YYYYMMDD', 'MMDDYYYY'], default='YYYYMMDD',
        help="Date representation format (default: YYYYMMDD)."
    )
    parser.add_argument(
        '--preview', action='store_true', default=True,
        help="Display formatted console preview of generated records."
    )

    args = parser.parse_args()

    # Generate dataset
    dataset = generate_mock_dataset(
        records_per_state=args.records_per_state,
        states=args.states,
        date_format=args.date_format,
        output_format=args.format,
        output_file=args.output
    )

    if args.preview or not args.output:
        print_console_preview(dataset, sample_count=6)

    if args.output:
        print(f"✅ Successfully exported {len(dataset)} synthetic AAMVA records to '{args.output}' [{args.format.upper()}].")


if __name__ == '__main__':
    main()
