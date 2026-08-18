export interface TaxGuidance {
  /** Short summary of tax filing treatment/purpose */
  purpose: string;
  /** Relevant IRS Schedule or Form (e.g. Schedule A, Schedule C, Schedule E, Form 1040, Form 5695) */
  scheduleOrForm?: string;
  /** High level deductibility indicator */
  deductibleStatus?: 'deductible' | 'partial' | 'non-deductible' | 'capitalized' | 'taxable-income' | 'tax-credit';
  /**
   * Override guidance to show when property is confirmed personal use.
   */
  personalUse?: {
    purpose: string;
    scheduleOrForm?: string;
    deductibleStatus?: TaxGuidance['deductibleStatus'];
  };
}

/**
 * Resolves which variant of a guidance entry to display.
 */
export const resolveTaxGuidance = (
  guidance: TaxGuidance | null,
  isRentalProperty?: boolean | null
): TaxGuidance | null => {
  if (!guidance) return null;
  if (isRentalProperty === false && guidance.personalUse) {
    const { personalUse, ...base } = guidance;
    return { ...base, ...personalUse };
  }
  return guidance;
};

export const CATEGORY_TAX_GUIDANCE: Record<string, TaxGuidance> = {
  // Property
  'Mortgage & Rent': {
    purpose: 'Mortgage interest is itemized on Schedule A; rent is deductible for rentals (Schedule E) or home office (Schedule C).',
    scheduleOrForm: 'Schedule A / Schedule E',
    deductibleStatus: 'partial',
    personalUse: {
      purpose: 'Mortgage interest is itemized on Schedule A (Form 1098, up to $750k debt limit); rent paid for a personal residence is non-deductible.',
      scheduleOrForm: 'Schedule A Line 8a',
      deductibleStatus: 'partial'
    }
  },
  'Tax': {
    purpose: 'State & local real estate taxes itemized on Schedule A (SALT, $10k cap) or 100% deductible on Schedule E for rentals.',
    scheduleOrForm: 'Schedule A (SALT) / Schedule E',
    deductibleStatus: 'deductible',
    personalUse: {
      purpose: 'State & local real estate taxes itemized on Schedule A, subject to the $10k SALT cap.',
      scheduleOrForm: 'Schedule A Line 5b (SALT)',
      deductibleStatus: 'partial'
    }
  },
  'Utilities': {
    purpose: '100% deductible for rental properties (Schedule E) or prorated for home office (Schedule C); non-deductible for personal home.',
    scheduleOrForm: 'Schedule E / Schedule C',
    deductibleStatus: 'partial',
    personalUse: {
      purpose: 'Non-deductible for a personal home, unless a portion qualifies for the home office deduction on Schedule C.',
      scheduleOrForm: 'Schedule C (Home Office)',
      deductibleStatus: 'non-deductible'
    }
  },
  'Insurance': {
    purpose: 'Hazard & flood insurance deductible on Schedule E for rentals; non-deductible for personal residence.',
    scheduleOrForm: 'Schedule E (Rentals)',
    deductibleStatus: 'partial',
    personalUse: {
      purpose: 'Non-deductible for a personal residence.',
      scheduleOrForm: undefined,
      deductibleStatus: 'non-deductible'
    }
  },
  'Maintenance & Repairs': {
    purpose: 'Current-year repairs to keep property in operating condition (Schedule E / Schedule C); distinct from capital improvements.',
    scheduleOrForm: 'Schedule E / Schedule C',
    deductibleStatus: 'deductible',
    personalUse: {
      purpose: 'Non-deductible for a personal residence; repairs only affect cost basis if part of a larger capital improvement.',
      scheduleOrForm: undefined,
      deductibleStatus: 'non-deductible'
    }
  },
  'Improvements & Renovations': {
    purpose: 'Capital expenditures added to cost basis (reduces future capital gains tax on sale) or depreciated on Schedule E.',
    scheduleOrForm: 'Cost Basis / Form 4562',
    deductibleStatus: 'capitalized',
    personalUse: {
      purpose: 'Capital expenditures added to cost basis, reducing future capital gains tax on sale; no current-year depreciation for a personal residence.',
      scheduleOrForm: 'Cost Basis',
      deductibleStatus: 'capitalized'
    }
  },
  'Furnishings & Appliances': {
    purpose: 'Depreciable assets (5-7 yr property, Section 179/MACRS) for rentals/offices; personal furniture is non-deductible.',
    scheduleOrForm: 'Schedule E / Form 4562',
    deductibleStatus: 'capitalized',
    personalUse: {
      purpose: 'Non-deductible personal furniture and appliances.',
      scheduleOrForm: undefined,
      deductibleStatus: 'non-deductible'
    }
  },
  'Services': {
    purpose: 'Property maintenance, cleaning, and security deductible on Schedule E (rentals) or Schedule C (business).',
    scheduleOrForm: 'Schedule E / Schedule C',
    deductibleStatus: 'deductible',
    personalUse: {
      purpose: 'Non-deductible for personal residence upkeep.',
      scheduleOrForm: undefined,
      deductibleStatus: 'non-deductible'
    }
  },
  'Solar': {
    purpose: 'Residential Clean Energy Credit (Form 5695, 30% tax credit); SREC sales reportable as taxable other income.',
    scheduleOrForm: 'Form 5695 / Form 1040',
    deductibleStatus: 'tax-credit'
  },

  // Fleet
  'Financing': {
    purpose: 'Vehicle loan interest and lease payments are deductible for business use portion on Schedule C.',
    scheduleOrForm: 'Schedule C Line 16b / Line 20a',
    deductibleStatus: 'partial'
  },
  'Fuel & Charging': {
    purpose: 'Deductible for business vehicles using actual expense method on Schedule C (or take standard mileage rate).',
    scheduleOrForm: 'Schedule C Line 9',
    deductibleStatus: 'deductible'
  },
  'Insurance & Registration': {
    purpose: 'Business auto insurance deductible on Schedule C; value-based vehicle registration tax deductible on Schedule A (SALT).',
    scheduleOrForm: 'Schedule C / Schedule A',
    deductibleStatus: 'partial'
  },
  'Parking & Tolls': {
    purpose: '100% deductible for business trips and client visits on Schedule C (daily commuting is non-deductible).',
    scheduleOrForm: 'Schedule C Line 9',
    deductibleStatus: 'deductible'
  },
  'Purchase': {
    purpose: 'Capital vehicle acquisition depreciated on Form 4562 (Section 179 / bonus depreciation); clean vehicles eligible for Form 8936 credit.',
    scheduleOrForm: 'Form 4562 / Form 8936',
    deductibleStatus: 'capitalized'
  },

  // Travel
  'Transportation': {
    purpose: '100% deductible on Schedule C for ordinary and necessary business travel away from tax home (IRC §162).',
    scheduleOrForm: 'Schedule C Line 24a',
    deductibleStatus: 'deductible'
  },
  'Lodging': {
    purpose: '100% deductible for overnight business travel away from tax home on Schedule C.',
    scheduleOrForm: 'Schedule C Line 24a',
    deductibleStatus: 'deductible'
  },
  'Food & Dining': {
    purpose: 'Business travel meals and client dining are 50% deductible on Schedule C (IRC §274(n)).',
    scheduleOrForm: 'Schedule C Line 24b (50%)',
    deductibleStatus: 'partial'
  },
  'Activities & Entertainment': {
    purpose: 'Entertainment is non-deductible under TCJA; professional conferences and educational seminars are 100% deductible.',
    scheduleOrForm: 'Schedule C / Non-deductible',
    deductibleStatus: 'partial'
  },
  'Travel::Technology': {
    purpose: 'Travel work equipment, portable Wi-Fi, and software subscriptions deductible on Schedule C.',
    scheduleOrForm: 'Schedule C Line 18 / Line 22',
    deductibleStatus: 'deductible'
  },
  'Travel::Shopping': {
    purpose: 'Personal shopping is non-deductible; business travel gear and business gifts (up to $25/person) are deductible on Schedule C.',
    scheduleOrForm: 'Schedule C / Non-deductible',
    deductibleStatus: 'partial'
  },
  'Travel Services & Fees': {
    purpose: 'Travel insurance, visa/passport fees, and baggage fees for business travel are deductible on Schedule C.',
    scheduleOrForm: 'Schedule C Line 24a',
    deductibleStatus: 'deductible'
  },

  // Family
  'Family::Income': {
    purpose: 'Gross taxable income reportable on Form 1040 (W-2 wages, 1099-NEC, 1099-DIV, 1099-INT, Schedule 1).',
    scheduleOrForm: 'Form 1040 Line 1–8',
    deductibleStatus: 'taxable-income'
  },
  'Health & Wellness': {
    purpose: 'Qualified medical expenses deductible on Schedule A (amount exceeding 7.5% of AGI) or tax-free HSA/FSA distribution.',
    scheduleOrForm: 'Schedule A Line 1–4 / Form 8889',
    deductibleStatus: 'deductible'
  },
  'Personal Care': {
    purpose: 'Non-deductible personal living expenses (IRC §262).',
    scheduleOrForm: 'Non-deductible',
    deductibleStatus: 'non-deductible'
  },
  'Shopping': {
    purpose: 'Personal shopping is non-deductible; sales tax may be itemized on Schedule A if electing sales tax over income tax.',
    scheduleOrForm: 'Non-deductible / Schedule A',
    deductibleStatus: 'non-deductible'
  },
  'Food & Groceries': {
    purpose: 'Personal household food and grocery purchases are non-deductible personal expenses.',
    scheduleOrForm: 'Non-deductible',
    deductibleStatus: 'non-deductible'
  },
  'Entertainment & Leisure': {
    purpose: 'Personal recreation, entertainment, and hobby expenses are non-deductible.',
    scheduleOrForm: 'Non-deductible',
    deductibleStatus: 'non-deductible'
  },
  'Education': {
    purpose: 'Higher education tuition eligible for American Opportunity Credit ($2,500) or Lifetime Learning Credit (Form 8863); student loan interest deductible on Schedule 1.',
    scheduleOrForm: 'Form 8863 / Schedule 1',
    deductibleStatus: 'tax-credit'
  },
  'Gifts & Donations': {
    purpose: 'Charitable contributions to qualified 501(c)(3) non-profits are itemized deductions on Schedule A (up to 60% AGI).',
    scheduleOrForm: 'Schedule A Line 11–14',
    deductibleStatus: 'deductible'
  },
  'Family & Childcare': {
    purpose: 'Child and dependent care expenses eligible for Child Care Credit on Form 2441 (or Dependent Care FSA).',
    scheduleOrForm: 'Form 2441',
    deductibleStatus: 'tax-credit'
  },
  'Subscriptions and Memberships': {
    purpose: 'Personal subscriptions are non-deductible; professional union/trade dues deductible for business on Schedule C.',
    scheduleOrForm: 'Schedule C / Non-deductible',
    deductibleStatus: 'partial'
  },
  'Personal Finance': {
    purpose: 'Transfers and payments; retirement distributions (SSA/Pension) are reportable on Form 1040 Lines 4–6.',
    scheduleOrForm: 'Form 1040 Line 4–6',
    deductibleStatus: 'partial'
  },
  'Taxes': {
    purpose: 'State & local income taxes deductible on Schedule A (SALT, $10k cap); federal payments count toward annual liability.',
    scheduleOrForm: 'Schedule A (SALT) / Form 1040',
    deductibleStatus: 'deductible'
  },

  // Business
  'Income': {
    purpose: 'Gross business receipts and sales revenue reported on Schedule C Line 1 (Form 1040).',
    scheduleOrForm: 'Schedule C Line 1',
    deductibleStatus: 'taxable-income'
  },
  'Business::Income': {
    purpose: 'Gross business receipts and sales revenue reported on Schedule C Line 1 (Form 1040).',
    scheduleOrForm: 'Schedule C Line 1',
    deductibleStatus: 'taxable-income'
  },
  'Commissions & Fees': {
    purpose: 'Broker commission splits, desk fees, transaction fees, and referral fees 100% deductible on Schedule C Line 10 (Commissions and fees).',
    scheduleOrForm: 'Schedule C Line 10',
    deductibleStatus: 'deductible'
  },
  'Professional Development': {
    purpose: 'Continuing education (CE), licensing exams, coaching, and workshops to maintain/improve business skills 100% deductible on Schedule C Line 27a / Line 22.',
    scheduleOrForm: 'Schedule C Line 27a / Line 22',
    deductibleStatus: 'deductible'
  },
  'Dues & Subscriptions': {
    purpose: 'MLS access fees, Realtor/trade association dues, and professional memberships 100% deductible on Schedule C Line 22 / Line 27a.',
    scheduleOrForm: 'Schedule C Line 22 / Line 27a',
    deductibleStatus: 'deductible'
  },
  'Office & Supplies': {
    purpose: 'Ordinary and necessary office consumables and software deductible on Schedule C Line 18 / Line 22.',
    scheduleOrForm: 'Schedule C Line 18 / Line 22',
    deductibleStatus: 'deductible'
  },
  'Professional Services': {
    purpose: 'Legal, accounting, bookkeeping, and consulting fees 100% deductible on Schedule C Line 17.',
    scheduleOrForm: 'Schedule C Line 17',
    deductibleStatus: 'deductible'
  },
  'Technology': {
    purpose: 'Hosting, SaaS subscriptions, hardware, and tech support 100% deductible on Schedule C.',
    scheduleOrForm: 'Schedule C Line 18 / Line 22',
    deductibleStatus: 'deductible'
  },
  'Business::Technology': {
    purpose: 'Hosting, SaaS subscriptions, hardware, and tech support 100% deductible on Schedule C.',
    scheduleOrForm: 'Schedule C Line 18 / Line 22',
    deductibleStatus: 'deductible'
  },
  'Marketing & Advertising': {
    purpose: 'Online ads, print marketing, and website development 100% deductible on Schedule C Line 8.',
    scheduleOrForm: 'Schedule C Line 8',
    deductibleStatus: 'deductible'
  },
  'Travel & Meals': {
    purpose: 'Business travel is 100% deductible (Line 24a); business client meals are 50% deductible (Line 24b).',
    scheduleOrForm: 'Schedule C Line 24a / 24b',
    deductibleStatus: 'partial'
  },
  'Payroll & Contractors': {
    purpose: 'W-2 employee wages (Line 26) and 1099 contractor payments (Line 11; requires Form 1099-NEC if $600+) are 100% deductible.',
    scheduleOrForm: 'Schedule C Line 11 / Line 26',
    deductibleStatus: 'deductible'
  },
  'Taxes & Licenses': {
    purpose: 'Business licenses, local permits, and employer payroll taxes 100% deductible on Schedule C Line 23.',
    scheduleOrForm: 'Schedule C Line 23',
    deductibleStatus: 'deductible'
  }
};

export const SUBCATEGORY_TAX_GUIDANCE: Record<string, TaxGuidance> = {
  // Property
  'Mortgage Payment': {
    purpose: 'Interest portion is deductible on Schedule A (Form 1098, up to $750k debt limit); principal is non-deductible.',
    scheduleOrForm: 'Schedule A Line 8a (Form 1098)',
    deductibleStatus: 'deductible'
  },
  'Rent Payment': {
    purpose: 'Non-deductible for personal home; 100% deductible on Schedule E (rental property) or Schedule C (home office).',
    scheduleOrForm: 'Schedule E Line 8 / Schedule C',
    deductibleStatus: 'partial',
    personalUse: {
      purpose: 'Rent paid for a personal residence is non-deductible.',
      scheduleOrForm: undefined,
      deductibleStatus: 'non-deductible'
    }
  },
  'HOA / Condo Fees': {
    purpose: 'Non-deductible for personal residence; 100% deductible on Schedule E for rental properties.',
    scheduleOrForm: 'Schedule E Line 19',
    deductibleStatus: 'partial',
    personalUse: {
      purpose: 'Non-deductible for a personal residence.',
      scheduleOrForm: undefined,
      deductibleStatus: 'non-deductible'
    }
  },
  'Property Tax': {
    purpose: 'State & local property taxes deductible on Schedule A (subject to $10k SALT cap) or 100% on Schedule E (rentals).',
    scheduleOrForm: 'Schedule A Line 5b (SALT) / Schedule E',
    deductibleStatus: 'deductible',
    personalUse: {
      purpose: 'Deductible on Schedule A, subject to the $10k SALT cap.',
      scheduleOrForm: 'Schedule A Line 5b (SALT)',
      deductibleStatus: 'partial'
    }
  },
  'School District Tax': {
    purpose: 'Local school taxes deductible under real estate taxes on Schedule A (SALT cap) or Schedule E.',
    scheduleOrForm: 'Schedule A Line 5b (SALT) / Schedule E',
    deductibleStatus: 'deductible',
    personalUse: {
      purpose: 'Deductible under real estate taxes on Schedule A, subject to the SALT cap.',
      scheduleOrForm: 'Schedule A Line 5b (SALT)',
      deductibleStatus: 'partial'
    }
  },
  'Special Assessment': {
    purpose: 'Local assessments for improvements (sidewalks, sewer lines) are added to property cost basis; maintenance assessments are deductible on Schedule E.',
    scheduleOrForm: 'Cost Basis / Schedule E',
    deductibleStatus: 'capitalized',
    personalUse: {
      purpose: 'Assessments for improvements are added to property cost basis; maintenance assessments are non-deductible for a personal residence.',
      scheduleOrForm: 'Cost Basis',
      deductibleStatus: 'capitalized'
    }
  },
  'County & City Tax': {
    purpose: 'County/municipal property taxes deductible on Schedule A (SALT limit) or Schedule E.',
    scheduleOrForm: 'Schedule A Line 5b / Schedule E',
    deductibleStatus: 'deductible',
    personalUse: {
      purpose: 'Deductible on Schedule A, subject to the SALT cap.',
      scheduleOrForm: 'Schedule A Line 5b',
      deductibleStatus: 'partial'
    }
  },
  'Transfer Tax': {
    purpose: 'Closing transfer taxes are added to purchase basis (lowers future capital gains) or subtracted from sale proceeds.',
    scheduleOrForm: 'Cost Basis / Form 8949',
    deductibleStatus: 'capitalized'
  },
  'Supplemental Property Tax': {
    purpose: 'Supplemental tax bills from property re-assessment; deductible on Schedule A (SALT) or Schedule E.',
    scheduleOrForm: 'Schedule A Line 5b (SALT) / Schedule E',
    deductibleStatus: 'deductible',
    personalUse: {
      purpose: 'Supplemental tax bills from property re-assessment; deductible on Schedule A, subject to the SALT cap.',
      scheduleOrForm: 'Schedule A Line 5b (SALT)',
      deductibleStatus: 'partial'
    }
  },

  // Property — Utilities
  'Electricity': {
    purpose: 'Deductible on Schedule E for rentals or Schedule C for home office; non-deductible for personal use.',
    scheduleOrForm: 'Schedule E Line 17 / Schedule C',
    deductibleStatus: 'partial',
    personalUse: {
      purpose: 'Non-deductible for personal use, unless a portion qualifies for the home office deduction on Schedule C.',
      scheduleOrForm: 'Schedule C (Home Office)',
      deductibleStatus: 'non-deductible'
    }
  },
  'Natural Gas': {
    purpose: 'Deductible on Schedule E for rentals or Schedule C for home office; non-deductible for personal use.',
    scheduleOrForm: 'Schedule E Line 17 / Schedule C',
    deductibleStatus: 'partial',
    personalUse: {
      purpose: 'Non-deductible for personal use, unless a portion qualifies for the home office deduction on Schedule C.',
      scheduleOrForm: 'Schedule C (Home Office)',
      deductibleStatus: 'non-deductible'
    }
  },
  'Water & Sewer': {
    purpose: 'Deductible on Schedule E for rentals; non-deductible for personal residence.',
    scheduleOrForm: 'Schedule E Line 17',
    deductibleStatus: 'partial',
    personalUse: {
      purpose: 'Non-deductible for a personal residence.',
      scheduleOrForm: undefined,
      deductibleStatus: 'non-deductible'
    }
  },
  'Trash & Recycling': {
    purpose: 'Deductible on Schedule E for rentals; non-deductible for personal residence.',
    scheduleOrForm: 'Schedule E Line 17',
    deductibleStatus: 'partial',
    personalUse: {
      purpose: 'Non-deductible for a personal residence.',
      scheduleOrForm: undefined,
      deductibleStatus: 'non-deductible'
    }
  },
  'Internet': {
    purpose: 'Business/home office portion deductible on Schedule C or Schedule E; personal portion non-deductible.',
    scheduleOrForm: 'Schedule C Line 22 / Schedule E',
    deductibleStatus: 'partial',
    personalUse: {
      purpose: 'The home-office portion may be deductible on Schedule C; the personal-use portion is non-deductible.',
      scheduleOrForm: 'Schedule C Line 22',
      deductibleStatus: 'partial'
    }
  },
  'Cable / Streaming': {
    purpose: 'Deductible on Schedule E if provided as a tenant amenity; non-deductible for personal residence.',
    scheduleOrForm: 'Schedule E Line 19',
    deductibleStatus: 'partial',
    personalUse: {
      purpose: 'Non-deductible for a personal residence.',
      scheduleOrForm: undefined,
      deductibleStatus: 'non-deductible'
    }
  },

  // Fleet — Fuel & Maintenance
  'Gasoline': {
    purpose: 'Deductible on Schedule C under actual vehicle expenses (or claim standard mileage rate of $0.67/mi).',
    scheduleOrForm: 'Schedule C Line 9',
    deductibleStatus: 'deductible'
  },
  'EV Charging': {
    purpose: 'Business EV charging deductible on Schedule C; home charger installation eligible for Form 8911 (up to $1,000 credit).',
    scheduleOrForm: 'Schedule C Line 9 / Form 8911',
    deductibleStatus: 'deductible'
  },
  'Oil Change': {
    purpose: 'Deductible business auto expense on Schedule C (actual expense method); non-deductible for personal.',
    scheduleOrForm: 'Schedule C Line 9',
    deductibleStatus: 'partial'
  },
  'Tires & Alignment': {
    purpose: 'Deductible business auto expense on Schedule C (actual expense method); non-deductible for personal.',
    scheduleOrForm: 'Schedule C Line 9',
    deductibleStatus: 'partial'
  },
  'Brakes': {
    purpose: 'Deductible business auto expense on Schedule C (actual expense method); non-deductible for personal.',
    scheduleOrForm: 'Schedule C Line 9',
    deductibleStatus: 'partial'
  },
  'Auto Insurance': {
    purpose: 'Business percentage of auto insurance is deductible on Schedule C Line 15.',
    scheduleOrForm: 'Schedule C Line 15',
    deductibleStatus: 'partial'
  },
  'Parking Fees': {
    purpose: '100% deductible on Schedule C for business visits and meetings (regular daily commute is non-deductible).',
    scheduleOrForm: 'Schedule C Line 9',
    deductibleStatus: 'deductible'
  },
  'Tolls': {
    purpose: '100% deductible on Schedule C for business travel (regular daily commute is non-deductible).',
    scheduleOrForm: 'Schedule C Line 9',
    deductibleStatus: 'deductible'
  },

  // Travel
  'Flights': {
    purpose: '100% deductible on Schedule C for business travel away from tax home; non-deductible for vacations.',
    scheduleOrForm: 'Schedule C Line 24a',
    deductibleStatus: 'deductible'
  },
  'Trains & Buses': {
    purpose: '100% deductible on Schedule C for business trips; non-deductible for personal travel.',
    scheduleOrForm: 'Schedule C Line 24a',
    deductibleStatus: 'deductible'
  },
  'Rental Car': {
    purpose: '100% deductible on Schedule C for business trips; personal portion non-deductible.',
    scheduleOrForm: 'Schedule C Line 24a',
    deductibleStatus: 'deductible'
  },
  'Rideshare & Taxi': {
    purpose: '100% deductible on Schedule C for business trips and client transit (commutes non-deductible).',
    scheduleOrForm: 'Schedule C Line 24a',
    deductibleStatus: 'deductible'
  },
  'Public Transit': {
    purpose: '100% deductible on Schedule C for business travel transit.',
    scheduleOrForm: 'Schedule C Line 24a',
    deductibleStatus: 'deductible'
  },
  'Ferries': {
    purpose: '100% deductible on Schedule C for business travel transportation.',
    scheduleOrForm: 'Schedule C Line 24a',
    deductibleStatus: 'deductible'
  },
  'Cruise': {
    purpose: 'Business cruises limited to standard per-diem caps (IRC §274(m)); personal cruises non-deductible.',
    scheduleOrForm: 'Schedule C Line 24a (Capped)',
    deductibleStatus: 'partial'
  },
  'Parking': {
    purpose: '100% deductible airport & hotel parking for business travel on Schedule C.',
    scheduleOrForm: 'Schedule C Line 24a',
    deductibleStatus: 'deductible'
  },
  'Hotel/Resort': {
    purpose: '100% deductible on Schedule C for overnight business travel away from tax home.',
    scheduleOrForm: 'Schedule C Line 24a',
    deductibleStatus: 'deductible'
  },
  'Vacation Rental': {
    purpose: '100% deductible for business trips (Airbnb/VRBO for conferences/work); non-deductible for personal vacation.',
    scheduleOrForm: 'Schedule C Line 24a',
    deductibleStatus: 'deductible'
  },
  'Resort Fees': {
    purpose: 'Deductible as part of necessary business lodging on Schedule C.',
    scheduleOrForm: 'Schedule C Line 24a',
    deductibleStatus: 'deductible'
  },
  'Restaurants': {
    purpose: 'Business travel meals and client dining are 50% deductible on Schedule C (IRC §274(n)).',
    scheduleOrForm: 'Schedule C Line 24b (50%)',
    deductibleStatus: 'partial'
  },
  'Cafes & Coffee': {
    purpose: '50% deductible on Schedule C for business meetings or travel sustenance.',
    scheduleOrForm: 'Schedule C Line 24b (50%)',
    deductibleStatus: 'partial'
  },
  'Room Service': {
    purpose: 'Food portion is 50% deductible on Schedule C for business travel; lodging fees 100%.',
    scheduleOrForm: 'Schedule C Line 24b (50%)',
    deductibleStatus: 'partial'
  },
  'Groceries While Traveling': {
    purpose: '50% deductible on Schedule C when purchased in lieu of restaurant meals during business travel.',
    scheduleOrForm: 'Schedule C Line 24b (50%)',
    deductibleStatus: 'partial'
  },
  'Snacks': {
    purpose: '50% deductible on Schedule C during business travel.',
    scheduleOrForm: 'Schedule C Line 24b (50%)',
    deductibleStatus: 'partial'
  },
  'Tours & Excursions': {
    purpose: 'Entertainment is non-deductible under TCJA unless directly tied to an active business seminar.',
    scheduleOrForm: 'Non-deductible',
    deductibleStatus: 'non-deductible'
  },
  'Attraction Tickets': {
    purpose: 'Personal entertainment is non-deductible under IRC §274.',
    scheduleOrForm: 'Non-deductible',
    deductibleStatus: 'non-deductible'
  },
  'Events & Shows': {
    purpose: 'Client entertainment is non-deductible under TCJA; trade conferences are 100% deductible.',
    scheduleOrForm: 'Non-deductible / Schedule C',
    deductibleStatus: 'partial'
  },
  'Travel Adapters & Chargers': {
    purpose: '100% deductible on Schedule C as business supplies for remote work.',
    scheduleOrForm: 'Schedule C Line 22',
    deductibleStatus: 'deductible'
  },
  'Portable Wi-Fi & SIM Cards': {
    purpose: '100% deductible on Schedule C as travel communication expenses.',
    scheduleOrForm: 'Schedule C Line 24a',
    deductibleStatus: 'deductible'
  },
  'Camera & Gear Rentals': {
    purpose: 'Deductible on Schedule C if used for commercial photography, marketing, or business projects.',
    scheduleOrForm: 'Schedule C Line 20b',
    deductibleStatus: 'partial'
  },
  'Device Repairs': {
    purpose: 'Deductible maintenance on Schedule C for business laptops, phones, and equipment.',
    scheduleOrForm: 'Schedule C Line 21',
    deductibleStatus: 'deductible'
  },
  'Travel Apps & Software': {
    purpose: '100% deductible business software & travel workflow apps on Schedule C.',
    scheduleOrForm: 'Schedule C Line 18',
    deductibleStatus: 'deductible'
  },
  'Souvenirs & Gifts': {
    purpose: 'Business gifts are deductible up to $25 per client per tax year (IRC §274(b)); personal gifts are non-deductible.',
    scheduleOrForm: 'Schedule C (Max $25/person)',
    deductibleStatus: 'partial'
  },
  'Travel Gear & Luggage': {
    purpose: 'Deductible on Schedule C if purchased exclusively for business travel equipment transport.',
    scheduleOrForm: 'Schedule C Line 22',
    deductibleStatus: 'partial'
  },
  'Travel Insurance': {
    purpose: '100% deductible on Schedule C for business travel; non-deductible for personal vacations.',
    scheduleOrForm: 'Schedule C Line 15 / Line 24a',
    deductibleStatus: 'deductible'
  },
  'Visa & Passport Fees': {
    purpose: 'Deductible on Schedule C if required specifically for international business travel.',
    scheduleOrForm: 'Schedule C Line 24a',
    deductibleStatus: 'deductible'
  },
  'Baggage Fees': {
    purpose: '100% deductible airline baggage fees for business travel on Schedule C.',
    scheduleOrForm: 'Schedule C Line 24a',
    deductibleStatus: 'deductible'
  },
  'Currency Exchange': {
    purpose: 'Foreign transaction and currency conversion fees deductible on Schedule C for business travel.',
    scheduleOrForm: 'Schedule C Line 24a',
    deductibleStatus: 'deductible'
  },
  'Travel Agent Fees': {
    purpose: '100% deductible booking and travel agency fees for business travel on Schedule C.',
    scheduleOrForm: 'Schedule C Line 24a',
    deductibleStatus: 'deductible'
  },

  // Family
  'Salary & Wages': {
    purpose: 'Taxable ordinary income reported on Form 1040 Line 1a (from W-2 Box 1).',
    scheduleOrForm: 'Form 1040 Line 1a',
    deductibleStatus: 'taxable-income'
  },
  'Bonus & Commission': {
    purpose: 'Taxable supplemental wages reported on Form 1040 Line 1a.',
    scheduleOrForm: 'Form 1040 Line 1a',
    deductibleStatus: 'taxable-income'
  },
  'Freelance & Side Income': {
    purpose: 'Self-employment earnings reported on Schedule C; subject to income tax and 15.3% Self-Employment tax (Schedule SE).',
    scheduleOrForm: 'Schedule C / Schedule SE',
    deductibleStatus: 'taxable-income'
  },
  'Investment & Dividends': {
    purpose: 'Taxable/qualified dividends on Form 1040 Line 3a/3b and taxable interest on Line 2b (Forms 1099-DIV/INT).',
    scheduleOrForm: 'Form 1040 Line 2b / Line 3',
    deductibleStatus: 'taxable-income'
  },
  'Rental Income': {
    purpose: 'Gross rental revenue reported on Schedule E Line 3 (Form 1040).',
    scheduleOrForm: 'Schedule E Line 3',
    deductibleStatus: 'taxable-income'
  },
  'Tax Refund': {
    purpose: 'State tax refund is taxable on Schedule 1 Line 1 only if you itemized deductions in the prior tax year.',
    scheduleOrForm: 'Schedule 1 Line 1 (Form 1099-G)',
    deductibleStatus: 'taxable-income'
  },
  'Reimbursement': {
    purpose: 'Non-taxable if under an accountable employer reimbursement plan; taxable if non-accountable.',
    scheduleOrForm: 'Non-taxable (Accountable)',
    deductibleStatus: 'taxable-income'
  },
  'Gifts Received': {
    purpose: 'Non-taxable to the recipient (gift tax is paid by the donor if gifts exceed $18,000/yr).',
    scheduleOrForm: 'Non-taxable',
    deductibleStatus: 'taxable-income'
  },
  'Unemployment Benefits': {
    purpose: 'Taxable government compensation reported on Form 1040 Schedule 1 Line 7 (Form 1099-G).',
    scheduleOrForm: 'Schedule 1 Line 7',
    deductibleStatus: 'taxable-income'
  },
  'Doctor Visits': {
    purpose: 'Deductible medical expense on Schedule A (amount exceeding 7.5% AGI) or HSA/FSA tax-free distribution.',
    scheduleOrForm: 'Schedule A Line 1 / HSA',
    deductibleStatus: 'deductible'
  },
  'Dental Care': {
    purpose: 'Deductible on Schedule A (7.5% AGI threshold) or HSA/FSA eligible expense.',
    scheduleOrForm: 'Schedule A Line 1 / HSA',
    deductibleStatus: 'deductible'
  },
  'Vision Care': {
    purpose: 'Eye exams, prescription glasses, contacts, and LASIK deductible on Schedule A or HSA/FSA.',
    scheduleOrForm: 'Schedule A Line 1 / HSA',
    deductibleStatus: 'deductible'
  },
  'Pharmacy & Prescriptions': {
    purpose: 'Prescription medicines and insulin deductible on Schedule A (7.5% AGI floor) or HSA/FSA.',
    scheduleOrForm: 'Schedule A Line 1 / HSA',
    deductibleStatus: 'deductible'
  },
  'Gym & Fitness': {
    purpose: 'Non-deductible personal expense unless prescribed by a physician with a Letter of Medical Necessity (LMN).',
    scheduleOrForm: 'Non-deductible / HSA (LMN)',
    deductibleStatus: 'non-deductible'
  },
  'Therapy & Counseling': {
    purpose: 'Licensed mental health treatment deductible on Schedule A (7.5% AGI floor) or HSA/FSA.',
    scheduleOrForm: 'Schedule A Line 1 / HSA',
    deductibleStatus: 'deductible'
  },
  'Tuition': {
    purpose: 'Qualified college tuition eligible for American Opportunity Credit ($2,500/yr) or Lifetime Learning Credit (Form 8863).',
    scheduleOrForm: 'Form 8863 (Tax Credit)',
    deductibleStatus: 'tax-credit'
  },
  'Student Loans': {
    purpose: 'Student loan interest is an above-the-line deduction on Schedule 1 Line 21 (up to $2,500, Form 1098-E); principal is non-deductible.',
    scheduleOrForm: 'Schedule 1 Line 21 (Max $2,500)',
    deductibleStatus: 'deductible'
  },
  'Books & Supplies': {
    purpose: 'Required course materials eligible for education tax credits on Form 8863 or 529 plan tax-free withdrawal.',
    scheduleOrForm: 'Form 8863 / 529 Plan',
    deductibleStatus: 'tax-credit'
  },
  'Courses & Certifications': {
    purpose: 'Eligible for Lifetime Learning Credit (Form 8863) or deductible on Schedule C if maintaining current job/trade skills.',
    scheduleOrForm: 'Form 8863 / Schedule C',
    deductibleStatus: 'deductible'
  },
  'Charitable Donations': {
    purpose: 'Itemized deduction on Schedule A Line 11 for cash/check donations to qualified 501(c)(3) charities (keep bank records/letters).',
    scheduleOrForm: 'Schedule A Line 11',
    deductibleStatus: 'deductible'
  },
  'Religious Contributions': {
    purpose: 'Itemized deduction on Schedule A Line 11 for tithes/donations to churches, mosques, synagogues, and temples.',
    scheduleOrForm: 'Schedule A Line 11',
    deductibleStatus: 'deductible'
  },
  'Childcare & Daycare': {
    purpose: 'Qualifying expenses for children under 13 eligible for Child & Dependent Care Credit (Form 2441) or Dependent Care FSA.',
    scheduleOrForm: 'Form 2441 (Child Care Credit)',
    deductibleStatus: 'tax-credit'
  },
  'Elder Care': {
    purpose: 'Qualified medical elder care deductible on Schedule A or eligible for Dependent Care Credit on Form 2441.',
    scheduleOrForm: 'Schedule A Line 1 / Form 2441',
    deductibleStatus: 'deductible'
  },
  'Federal Income Tax': {
    purpose: 'Federal tax payments credited against total annual tax liability on Form 1040 Line 25/26.',
    scheduleOrForm: 'Form 1040 Line 25/26 (Tax Credit)',
    deductibleStatus: 'deductible'
  },
  'State Income Tax': {
    purpose: 'State withholding and estimated tax payments are itemized deductions on Schedule A Line 5a (SALT, $10k cap).',
    scheduleOrForm: 'Schedule A Line 5a (SALT)',
    deductibleStatus: 'deductible'
  },
  'Estimated Tax Payments': {
    purpose: 'Quarterly Form 1040-ES estimated payments credited toward annual tax liability on Form 1040 Line 26.',
    scheduleOrForm: 'Form 1040 Line 26',
    deductibleStatus: 'deductible'
  },
  'Tax Preparation Fees': {
    purpose: 'Non-deductible for W-2 taxpayers under TCJA; portion related to Schedule C / Schedule E is fully deductible.',
    scheduleOrForm: 'Schedule C Line 17 / Schedule E',
    deductibleStatus: 'partial'
  },
  'IRS Penalties & Interest': {
    purpose: 'IRS penalties and late-filing fines are strictly non-deductible under IRC §162(f).',
    scheduleOrForm: 'Non-deductible (IRC §162(f))',
    deductibleStatus: 'non-deductible'
  },
  'Local & City Tax': {
    purpose: 'Local/city income taxes deductible on Schedule A Line 5a under the $10k SALT itemized deduction cap.',
    scheduleOrForm: 'Schedule A Line 5a (SALT)',
    deductibleStatus: 'deductible'
  },
  'Haircuts & Salon': {
    purpose: 'Non-deductible personal grooming expense.',
    scheduleOrForm: 'Non-deductible',
    deductibleStatus: 'non-deductible'
  },
  'Spa & Massage': {
    purpose: 'Non-deductible personal wellness expense (unless prescribed with Letter of Medical Necessity for HSA).',
    scheduleOrForm: 'Non-deductible / HSA (LMN)',
    deductibleStatus: 'non-deductible'
  },
  'Cosmetics & Toiletries': {
    purpose: 'Non-deductible personal care items.',
    scheduleOrForm: 'Non-deductible',
    deductibleStatus: 'non-deductible'
  },
  'Clothing & Apparel': {
    purpose: 'Everyday clothing is non-deductible under IRC §262; distinctive work uniforms not suitable for street wear are deductible on Schedule C.',
    scheduleOrForm: 'Non-deductible / Schedule C',
    deductibleStatus: 'non-deductible'
  },
  'Shoes & Footwear': {
    purpose: 'Non-deductible personal attire; safety steel-toe shoes deductible for business.',
    scheduleOrForm: 'Non-deductible',
    deductibleStatus: 'non-deductible'
  },
  'Accessories & Jewelry': {
    purpose: 'Non-deductible personal luxury items.',
    scheduleOrForm: 'Non-deductible',
    deductibleStatus: 'non-deductible'
  },
  'Electronics & Gadgets': {
    purpose: 'Personal devices non-deductible; devices used for business deductible on Schedule C.',
    scheduleOrForm: 'Schedule C / Non-deductible',
    deductibleStatus: 'partial'
  },
  'General Merchandise': {
    purpose: 'Non-deductible personal household shopping.',
    scheduleOrForm: 'Non-deductible',
    deductibleStatus: 'non-deductible'
  },
  'Groceries': {
    purpose: 'Non-deductible personal household living expense.',
    scheduleOrForm: 'Non-deductible',
    deductibleStatus: 'non-deductible'
  },
  'Coffee Shops': {
    purpose: 'Non-deductible personal beverage expense.',
    scheduleOrForm: 'Non-deductible',
    deductibleStatus: 'non-deductible'
  },
  'Alcohol & Bars': {
    purpose: 'Non-deductible personal dining expense.',
    scheduleOrForm: 'Non-deductible',
    deductibleStatus: 'non-deductible'
  },
  'Movies & Streaming': {
    purpose: 'Non-deductible personal entertainment.',
    scheduleOrForm: 'Non-deductible',
    deductibleStatus: 'non-deductible'
  },
  'Concerts & Events': {
    purpose: 'Non-deductible personal recreation.',
    scheduleOrForm: 'Non-deductible',
    deductibleStatus: 'non-deductible'
  },
  'Hobbies': {
    purpose: 'Hobby expenses are strictly non-deductible under TCJA (cannot offset hobby income).',
    scheduleOrForm: 'Non-deductible (TCJA)',
    deductibleStatus: 'non-deductible'
  },
  'Books & Magazines': {
    purpose: 'Personal reading is non-deductible; professional journals deductible on Schedule C.',
    scheduleOrForm: 'Schedule C / Non-deductible',
    deductibleStatus: 'partial'
  },
  'Video Games': {
    purpose: 'Non-deductible personal recreation.',
    scheduleOrForm: 'Non-deductible',
    deductibleStatus: 'non-deductible'
  },
  'Digital Service': {
    purpose: 'Personal digital subscriptions are non-deductible.',
    scheduleOrForm: 'Non-deductible',
    deductibleStatus: 'non-deductible'
  },
  'Gifts': {
    purpose: 'Gifts to individuals are non-deductible (donor must file Form 709 if gift exceeds $18,000/yr per person).',
    scheduleOrForm: 'Non-deductible (Form 709)',
    deductibleStatus: 'non-deductible'
  },
  'Kids Activities': {
    purpose: 'After-school activities are non-deductible; summer day camps (not overnight) qualify for Child Care Credit on Form 2441.',
    scheduleOrForm: 'Form 2441 / Non-deductible',
    deductibleStatus: 'partial'
  },
  'Pet Care': {
    purpose: 'Non-deductible personal expense (unless trained service animal for medical deduction on Schedule A).',
    scheduleOrForm: 'Non-deductible',
    deductibleStatus: 'non-deductible'
  },
  'Streaming & Media': {
    purpose: 'Non-deductible personal entertainment subscription.',
    scheduleOrForm: 'Non-deductible',
    deductibleStatus: 'non-deductible'
  },
  'Music & Audio': {
    purpose: 'Non-deductible personal entertainment subscription.',
    scheduleOrForm: 'Non-deductible',
    deductibleStatus: 'non-deductible'
  },
  'Cloud Storage & Software': {
    purpose: 'Deductible on Schedule C for business portion; personal portion is non-deductible.',
    scheduleOrForm: 'Schedule C / Non-deductible',
    deductibleStatus: 'partial'
  },
  'News & Publications': {
    purpose: 'Deductible on Schedule C if directly related to your business trade/industry; personal news is non-deductible.',
    scheduleOrForm: 'Schedule C Line 22',
    deductibleStatus: 'partial'
  },
  'Gym & Fitness Memberships': {
    purpose: 'Non-deductible personal expense.',
    scheduleOrForm: 'Non-deductible',
    deductibleStatus: 'non-deductible'
  },
  'Warehouse & Retail Clubs': {
    purpose: 'Non-deductible annual membership fee (Costco, Sam\'s Club).',
    scheduleOrForm: 'Non-deductible',
    deductibleStatus: 'non-deductible'
  },
  'Meal Kits & Food Delivery': {
    purpose: 'Non-deductible personal meal expense.',
    scheduleOrForm: 'Non-deductible',
    deductibleStatus: 'non-deductible'
  },
  'Gaming Subscriptions': {
    purpose: 'Non-deductible personal entertainment.',
    scheduleOrForm: 'Non-deductible',
    deductibleStatus: 'non-deductible'
  },
  'Professional & Trade Memberships': {
    purpose: '100% deductible on Schedule C for self-employed industry/trade associations.',
    scheduleOrForm: 'Schedule C Line 22',
    deductibleStatus: 'deductible'
  },
  'Bank & ATM Fees': {
    purpose: 'Non-deductible for personal bank accounts; deductible on Schedule C for business bank accounts.',
    scheduleOrForm: 'Schedule C / Non-deductible',
    deductibleStatus: 'partial'
  },
  'Life Insurance': {
    purpose: 'Premiums are non-deductible personal expenses; death benefit proceeds are generally received income tax-free.',
    scheduleOrForm: 'Non-deductible',
    deductibleStatus: 'non-deductible'
  },
  'CC Payment': {
    purpose: 'Non-deductible balance payment; interest on personal credit cards is non-deductible.',
    scheduleOrForm: 'Non-deductible',
    deductibleStatus: 'non-deductible'
  },
  'Pension': {
    purpose: 'Taxable retirement annuity/pension distributions reported on Form 1040 Line 5a/5b (Form 1099-R).',
    scheduleOrForm: 'Form 1040 Line 5',
    deductibleStatus: 'taxable-income'
  },
  'SSA': {
    purpose: 'Social Security benefits reported on Form 1040 Line 6a/6b (0% to 85% taxable based on combined income, Form SSA-1099).',
    scheduleOrForm: 'Form 1040 Line 6',
    deductibleStatus: 'taxable-income'
  },
  'CD': {
    purpose: 'Deposit to Certificate of Deposit is a transfer; interest earned is taxable on Form 1040 Line 2b (Form 1099-INT).',
    scheduleOrForm: 'Form 1040 Line 2b (Interest)',
    deductibleStatus: 'partial'
  },
  'Transfer': {
    purpose: 'Non-taxable transfer of funds between personal accounts.',
    scheduleOrForm: 'Non-taxable',
    deductibleStatus: 'non-deductible'
  },

  // Business
  'Broker Commission Split': {
    purpose: 'Broker commission splits paid to supervising/managing brokerage; 100% deductible on Schedule C Line 10 (Commissions and fees).',
    scheduleOrForm: 'Schedule C Line 10 (Commissions)',
    deductibleStatus: 'deductible'
  },
  'Broker Desk Fees': {
    purpose: 'Monthly desk or office fees paid to managing broker; 100% deductible on Schedule C Line 10 or Line 20b (Rent).',
    scheduleOrForm: 'Schedule C Line 10 / Line 20b',
    deductibleStatus: 'deductible'
  },
  'Brokerage Admin Fees': {
    purpose: 'Brokerage transaction coordinator, administrative, and tech portal fees; 100% deductible on Schedule C Line 10.',
    scheduleOrForm: 'Schedule C Line 10',
    deductibleStatus: 'deductible'
  },
  'Referral & Finder Fees': {
    purpose: 'Client referral commissions paid to other licensed agents/brokers; 100% deductible on Schedule C Line 10 (Form 1099-MISC/NEC if $600+).',
    scheduleOrForm: 'Schedule C Line 10 (1099-NEC)',
    deductibleStatus: 'deductible'
  },
  'Closing & Transaction Fees': {
    purpose: 'Direct transaction coordinator and closing processing fees; 100% deductible on Schedule C Line 10.',
    scheduleOrForm: 'Schedule C Line 10',
    deductibleStatus: 'deductible'
  },
  'Continuing Education (CE)': {
    purpose: 'Mandatory continuing education courses to maintain state license/credentials; 100% deductible on Schedule C Line 27a (Other Expenses).',
    scheduleOrForm: 'Schedule C Line 27a (Education)',
    deductibleStatus: 'deductible'
  },
  'Professional Licensing': {
    purpose: 'Annual or biennial state professional license renewal fees; 100% deductible on Schedule C Line 23 (Taxes and licenses).',
    scheduleOrForm: 'Schedule C Line 23',
    deductibleStatus: 'deductible'
  },
  'Certifications & Exams': {
    purpose: 'Advanced professional designation exams and credentials to improve trade skills; 100% deductible on Schedule C Line 27a.',
    scheduleOrForm: 'Schedule C Line 27a',
    deductibleStatus: 'deductible'
  },
  'Seminars & Workshops': {
    purpose: 'Industry seminars, webinars, and skill-building workshops; 100% deductible on Schedule C Line 27a.',
    scheduleOrForm: 'Schedule C Line 27a',
    deductibleStatus: 'deductible'
  },
  'Training & Coaching': {
    purpose: 'Business and sales coaching programs to improve business performance; 100% deductible on Schedule C Line 27a.',
    scheduleOrForm: 'Schedule C Line 27a',
    deductibleStatus: 'deductible'
  },
  'MLS Dues & Fees': {
    purpose: 'Multiple Listing Service (MLS) access fees, quarterly dues, and tech surcharges; 100% deductible on Schedule C Line 22 (Supplies/Dues).',
    scheduleOrForm: 'Schedule C Line 22 / Line 27a',
    deductibleStatus: 'deductible'
  },
  'Realtor / Trade Association Dues': {
    purpose: 'Local, state, and national trade association dues (NAR, state REALTOR® associations); non-lobbying portion 100% deductible on Schedule C Line 22.',
    scheduleOrForm: 'Schedule C Line 22 (Dues)',
    deductibleStatus: 'deductible'
  },
  'Industry Subscriptions': {
    purpose: 'Professional market data subscriptions, public records access, and trade research; 100% deductible on Schedule C Line 22.',
    scheduleOrForm: 'Schedule C Line 22',
    deductibleStatus: 'deductible'
  },
  'Professional Memberships': {
    purpose: 'Chamber of commerce and professional society memberships; 100% deductible on Schedule C Line 22.',
    scheduleOrForm: 'Schedule C Line 22',
    deductibleStatus: 'deductible'
  },
  'Board Dues': {
    purpose: 'Local real estate board or regulatory board annual dues; 100% deductible on Schedule C Line 22.',
    scheduleOrForm: 'Schedule C Line 22',
    deductibleStatus: 'deductible'
  },
  'Office Supplies': {
    purpose: '100% deductible business office consumables (pens, paper, ink, toner) on Schedule C Line 18.',
    scheduleOrForm: 'Schedule C Line 18',
    deductibleStatus: 'deductible'
  },
  'Equipment & Hardware': {
    purpose: 'Deductible under de minimis safe harbor ($2,500/item on Line 22) or capitalized on Form 4562 / Section 179.',
    scheduleOrForm: 'Schedule C Line 22 / Form 4562',
    deductibleStatus: 'deductible'
  },
  'Software & Subscriptions': {
    purpose: '100% deductible business productivity software and SaaS subscriptions on Schedule C Line 18 / Line 22.',
    scheduleOrForm: 'Schedule C Line 18 / Line 22',
    deductibleStatus: 'deductible'
  },
  'Printing & Postage': {
    purpose: '100% deductible business postage, shipping, and printing on Schedule C Line 18.',
    scheduleOrForm: 'Schedule C Line 18',
    deductibleStatus: 'deductible'
  },
  'Legal Fees': {
    purpose: '100% deductible business legal advice, contracts, and dispute resolution on Schedule C Line 17.',
    scheduleOrForm: 'Schedule C Line 17',
    deductibleStatus: 'deductible'
  },
  'Accounting & Bookkeeping': {
    purpose: '100% deductible accounting, bookkeeping, and business tax return preparation on Schedule C Line 17.',
    scheduleOrForm: 'Schedule C Line 17',
    deductibleStatus: 'deductible'
  },
  'Consulting Fees': {
    purpose: '100% deductible management, strategy, and professional consulting on Schedule C Line 17.',
    scheduleOrForm: 'Schedule C Line 17',
    deductibleStatus: 'deductible'
  },
  'Bank & Merchant Fees': {
    purpose: '100% deductible merchant processing fees (Stripe, Square, PayPal) and business bank fees on Schedule C.',
    scheduleOrForm: 'Schedule C Line 10 / Line 17',
    deductibleStatus: 'deductible'
  },
  'Computers & Devices': {
    purpose: 'Eligible for 100% Section 179 expensing or de minimis safe harbor on Schedule C / Form 4562.',
    scheduleOrForm: 'Form 4562 / Schedule C',
    deductibleStatus: 'deductible'
  },
  'Cloud & Hosting': {
    purpose: '100% deductible cloud servers (AWS, GCP, Azure) and website hosting on Schedule C.',
    scheduleOrForm: 'Schedule C Line 18 / Line 22',
    deductibleStatus: 'deductible'
  },
  'SaaS & Software Licenses': {
    purpose: '100% deductible annual software licensing and workflow tool subscriptions on Schedule C.',
    scheduleOrForm: 'Schedule C Line 18 / Line 22',
    deductibleStatus: 'deductible'
  },
  'IT Support & Repairs': {
    purpose: '100% deductible computer repairs, network setup, and IT technical support on Schedule C.',
    scheduleOrForm: 'Schedule C Line 21 / Line 22',
    deductibleStatus: 'deductible'
  },
  'Domain & DNS': {
    purpose: '100% deductible website domain registration and DNS infrastructure on Schedule C Line 8 / Line 18.',
    scheduleOrForm: 'Schedule C Line 8 / Line 18',
    deductibleStatus: 'deductible'
  },
  'Data & Cybersecurity': {
    purpose: '100% deductible anti-virus, security monitoring, VPN, and automated backup services on Schedule C.',
    scheduleOrForm: 'Schedule C Line 18 / Line 22',
    deductibleStatus: 'deductible'
  },
  'Online Advertising': {
    purpose: '100% deductible digital ad campaigns (Google Ads, Meta, LinkedIn, SEO) on Schedule C Line 8.',
    scheduleOrForm: 'Schedule C Line 8',
    deductibleStatus: 'deductible'
  },
  'Print Marketing': {
    purpose: '100% deductible brochures, business cards, mailers, and print ads on Schedule C Line 8.',
    scheduleOrForm: 'Schedule C Line 8',
    deductibleStatus: 'deductible'
  },
  'Website & Hosting': {
    purpose: '100% deductible marketing website design and maintenance on Schedule C Line 8.',
    scheduleOrForm: 'Schedule C Line 8',
    deductibleStatus: 'deductible'
  },
  'Social Media Tools': {
    purpose: '100% deductible marketing automation and social media management tools on Schedule C Line 8.',
    scheduleOrForm: 'Schedule C Line 8',
    deductibleStatus: 'deductible'
  },
  'Signage & Photography': {
    purpose: 'Property listing yard signs, professional listing photography, drone media, and 3D tours; 100% deductible on Schedule C Line 8 (Advertising).',
    scheduleOrForm: 'Schedule C Line 8 (Advertising)',
    deductibleStatus: 'deductible'
  },
  'Staging & Promotional': {
    purpose: 'Open house staging, listing flyers, promotional giveaways, and client collateral; 100% deductible on Schedule C Line 8.',
    scheduleOrForm: 'Schedule C Line 8 (Advertising)',
    deductibleStatus: 'deductible'
  },
  'Business Travel': {
    purpose: '100% deductible airfare, lodging, and transportation for business travel away from home on Schedule C Line 24a.',
    scheduleOrForm: 'Schedule C Line 24a',
    deductibleStatus: 'deductible'
  },
  'Client Meals': {
    purpose: '50% deductible client and business partner meals on Schedule C Line 24b (must have active business discussion).',
    scheduleOrForm: 'Schedule C Line 24b (50%)',
    deductibleStatus: 'partial'
  },
  'Conferences & Events': {
    purpose: '100% deductible trade conference registration, seminar fees, and booth exhibitions on Schedule C.',
    scheduleOrForm: 'Schedule C Line 24a / Line 8',
    deductibleStatus: 'deductible'
  },
  'Employee Payroll': {
    purpose: '100% deductible gross W-2 employee salaries and wages on Schedule C Line 26.',
    scheduleOrForm: 'Schedule C Line 26',
    deductibleStatus: 'deductible'
  },
  'Contractor Payments': {
    purpose: '100% deductible 1099 independent contractor fees on Schedule C Line 11 (file Form 1099-NEC if paid $600+).',
    scheduleOrForm: 'Schedule C Line 11 (Form 1099-NEC)',
    deductibleStatus: 'deductible'
  },
  'Employee Benefits': {
    purpose: '100% deductible employee health insurance (Line 14) and retirement contributions (Line 19) on Schedule C.',
    scheduleOrForm: 'Schedule C Line 14 / Line 19',
    deductibleStatus: 'deductible'
  },
  'Business Taxes': {
    purpose: '100% deductible employer payroll taxes (FICA, FUTA, SUTA) and local business taxes on Schedule C Line 23.',
    scheduleOrForm: 'Schedule C Line 23',
    deductibleStatus: 'deductible'
  },
  'Licenses & Permits': {
    purpose: '100% deductible state registrations, city business licenses, and professional permits on Schedule C Line 23.',
    scheduleOrForm: 'Schedule C Line 23',
    deductibleStatus: 'deductible'
  },
  'Business Insurance': {
    purpose: '100% deductible commercial liability, errors & omissions, and business property insurance on Schedule C Line 15.',
    scheduleOrForm: 'Schedule C Line 15',
    deductibleStatus: 'deductible'
  }
};

export const getCategoryTaxGuidance = (
  category: string | null | undefined,
  target?: string | null | undefined
): TaxGuidance | null => {
  if (!category) return null;
  if (target && `${target}::${category}` in CATEGORY_TAX_GUIDANCE) {
    return CATEGORY_TAX_GUIDANCE[`${target}::${category}`];
  }
  return CATEGORY_TAX_GUIDANCE[category] || null;
};

export const getSubcategoryTaxGuidance = (
  subcategory: string | null | undefined,
  category?: string | null | undefined,
  target?: string | null | undefined
): TaxGuidance | null => {
  if (!subcategory) return null;
  if (category && `${category}::${subcategory}` in SUBCATEGORY_TAX_GUIDANCE) {
    return SUBCATEGORY_TAX_GUIDANCE[`${category}::${subcategory}`];
  }
  if (target && `${target}::${subcategory}` in SUBCATEGORY_TAX_GUIDANCE) {
    return SUBCATEGORY_TAX_GUIDANCE[`${target}::${subcategory}`];
  }
  return SUBCATEGORY_TAX_GUIDANCE[subcategory] || null;
};

export interface ResolvedTransactionTaxContext {
  purpose: string;
  scheduleOrForm?: string;
  deductibleStatus: 'deductible' | 'partial' | 'non-deductible' | 'capitalized' | 'taxable-income' | 'tax-credit';
  badgeStyle: {
    bg: string;
    border: string;
    text: string;
    iconBg?: string;
  };
  headline: string;
}

export const getResolvedTransactionTaxGuidance = (params?: {
  target?: string | null;
  category?: string | null;
  subcategory?: string | null;
  isRefund?: boolean | null;
  isRentalProperty?: boolean | null;
}): ResolvedTransactionTaxContext => {
  const target = params?.target || 'Family';
  const category = params?.category || '';
  const subcategory = params?.subcategory || '';
  const isRefund = !!params?.isRefund;
  const isRentalProperty = params?.isRentalProperty;

  // 1. Credit (Refund / Inflow / Income) Mode
  if (isRefund) {
    if (category && category.toLowerCase().includes('income')) {
      return {
        headline: 'Taxable Inflow (Income)',
        purpose: 'Gross taxable income reportable on Form 1040 (W-2 wages, 1099-NEC, 1099-DIV, 1099-INT, Schedule 1 / Schedule C). Tax refunds or gifts are generally non-taxable.',
        scheduleOrForm: 'Form 1040 / Schedule C',
        deductibleStatus: 'taxable-income',
        badgeStyle: {
          bg: 'bg-teal-50 dark:bg-teal-950/40',
          border: 'border-teal-300 dark:border-teal-600',
          text: 'text-teal-950 dark:text-teal-200',
          iconBg: 'bg-teal-600 text-white dark:bg-teal-500 dark:text-slate-950'
        }
      };
    }

    if (target === 'Business') {
      return {
        headline: 'Business Expense Offset / Refund',
        purpose: 'Incoming vendor refund, rebate, or client credit offsets ordinary business expense deductions on Schedule C / Form 1120.',
        scheduleOrForm: 'Schedule C (Expense Offset)',
        deductibleStatus: 'deductible',
        badgeStyle: {
          bg: 'bg-indigo-50 dark:bg-indigo-950/40',
          border: 'border-indigo-300 dark:border-indigo-600',
          text: 'text-indigo-950 dark:text-indigo-200',
          iconBg: 'bg-indigo-600 text-white dark:bg-indigo-500 dark:text-slate-950'
        }
      };
    }

    return {
      headline: 'Refund / Inflow Credit',
      purpose: 'Incoming return, rebate, or reimbursement reduces the original expenditure. Cashback and purchase credit rewards are generally treated as purchase discounts and are non-taxable.',
      scheduleOrForm: 'Non-Taxable Return',
      deductibleStatus: 'non-deductible',
      badgeStyle: {
        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
        border: 'border-emerald-300 dark:border-emerald-600',
        text: 'text-emerald-950 dark:text-emerald-200',
        iconBg: 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950'
      }
    };
  }

  // 2. Debit (Expense) Mode — Look up subcategory or category
  const subGuidance = subcategory ? resolveTaxGuidance(getSubcategoryTaxGuidance(subcategory, category, target), isRentalProperty) : null;
  const catGuidance = resolveTaxGuidance(getCategoryTaxGuidance(category, target), isRentalProperty);
  const guidance = subGuidance || catGuidance;

  if (guidance) {
    let headline = 'Tax Treatment';
    let badgeStyle = {
      bg: 'bg-slate-50 dark:bg-slate-800/90',
      border: 'border-slate-300 dark:border-slate-600',
      text: 'text-slate-900 dark:text-slate-100',
      iconBg: 'bg-slate-700 text-white dark:bg-slate-600 dark:text-white'
    };

    if (guidance.deductibleStatus === 'deductible') {
      headline = '100% Tax Deductible';
      badgeStyle = {
        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
        border: 'border-emerald-300 dark:border-emerald-600',
        text: 'text-emerald-900 dark:text-emerald-200',
        iconBg: 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950'
      };
    } else if (guidance.deductibleStatus === 'partial') {
      headline = 'Partially Deductible / Conditional';
      badgeStyle = {
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        border: 'border-amber-300 dark:border-amber-600',
        text: 'text-amber-950 dark:text-amber-200',
        iconBg: 'bg-amber-600 text-white dark:bg-amber-500 dark:text-slate-950'
      };
    } else if (guidance.deductibleStatus === 'capitalized') {
      headline = 'Capitalized / Depreciable Basis';
      badgeStyle = {
        bg: 'bg-blue-50 dark:bg-blue-950/40',
        border: 'border-blue-300 dark:border-blue-600',
        text: 'text-blue-950 dark:text-blue-200',
        iconBg: 'bg-blue-600 text-white dark:bg-blue-500 dark:text-slate-950'
      };
    } else if (guidance.deductibleStatus === 'tax-credit') {
      headline = 'Tax Credit Eligible';
      badgeStyle = {
        bg: 'bg-purple-50 dark:bg-purple-950/40',
        border: 'border-purple-300 dark:border-purple-600',
        text: 'text-purple-950 dark:text-purple-200',
        iconBg: 'bg-purple-600 text-white dark:bg-purple-500 dark:text-slate-950'
      };
    } else if (guidance.deductibleStatus === 'taxable-income') {
      headline = 'Taxable Inflow';
      badgeStyle = {
        bg: 'bg-teal-50 dark:bg-teal-950/40',
        border: 'border-teal-300 dark:border-teal-600',
        text: 'text-teal-950 dark:text-teal-200',
        iconBg: 'bg-teal-600 text-white dark:bg-teal-500 dark:text-slate-950'
      };
    } else {
      headline = 'Non-Deductible Personal Expense';
      badgeStyle = {
        bg: 'bg-slate-50 dark:bg-slate-800/90',
        border: 'border-slate-300 dark:border-slate-600',
        text: 'text-slate-900 dark:text-slate-100',
        iconBg: 'bg-slate-700 text-white dark:bg-slate-600 dark:text-white'
      };
    }

    return {
      headline,
      purpose: guidance.purpose,
      scheduleOrForm: guidance.scheduleOrForm,
      deductibleStatus: guidance.deductibleStatus || 'non-deductible',
      badgeStyle
    };
  }

  // Fallback if custom or uncategorized
  if (target === 'Business') {
    return {
      headline: 'Business Expense',
      purpose: 'Ordinary and necessary business expenses are deductible on Schedule C / Form 1120.',
      scheduleOrForm: 'Schedule C',
      deductibleStatus: 'deductible',
      badgeStyle: {
        bg: 'bg-indigo-50 dark:bg-indigo-950/40',
        border: 'border-indigo-300 dark:border-indigo-600',
        text: 'text-indigo-950 dark:text-indigo-200',
        iconBg: 'bg-indigo-600 text-white dark:bg-indigo-500 dark:text-slate-950'
      }
    };
  }

  return {
    headline: 'Personal Living Expense',
    purpose: 'Standard household personal living expenses are generally non-deductible under IRC §262.',
    scheduleOrForm: 'Non-deductible',
    deductibleStatus: 'non-deductible',
    badgeStyle: {
      bg: 'bg-slate-50 dark:bg-slate-800/90',
      border: 'border-slate-300 dark:border-slate-600',
      text: 'text-slate-900 dark:text-slate-100',
      iconBg: 'bg-slate-700 text-white dark:bg-slate-600 dark:text-white'
    }
  };
};
