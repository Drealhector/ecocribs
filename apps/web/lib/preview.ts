/**
 * Preview mode — true when no real Clerk/Convex keys are present. Lets the
 * UI render with seed data so you can review the design before wiring up
 * production backends.
 */
export const IS_PREVIEW =
  process.env.NEXT_PUBLIC_PREVIEW_MODE === 'true' ||
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export const PREVIEW_DEALS = [
  {
    _id: 'deal_demo_001' as any,
    buyerName: 'Adaeze Nwosu',
    buyerEmail: 'adaeze.nwosu@example.com',
    buyerPhone: '+2348012345678',
    purchasePriceKobo: 4_500_000_00, // ₦4,500,000.00 in kobo
    paidAmountKobo: 1_500_000_00,
    state: 'CONTRACT_AWAITING_WITNESS',
    statusLabel: 'Awaiting Witness',
    assignedAgentIds: [],
    requiresWetInkDeed: true,
    createdAt: Date.now() - 14 * 86400_000,
    updatedAt: Date.now() - 60 * 60_000,
    propertyId: 'prop_demo_001' as any,
  },
  {
    _id: 'deal_demo_002' as any,
    buyerName: 'Ifeanyi Okeke',
    buyerEmail: 'ifeanyi.okeke@example.com',
    buyerPhone: '+1832555012',
    purchasePriceKobo: 12_500_000_00,
    paidAmountKobo: 12_500_000_00,
    state: 'AWAITING_GOVERNORS_CONSENT',
    statusLabel: "Awaiting Governor's Consent",
    assignedAgentIds: [],
    requiresWetInkDeed: true,
    createdAt: Date.now() - 90 * 86400_000,
    updatedAt: Date.now() - 3 * 86400_000,
    propertyId: 'prop_demo_002' as any,
  },
  {
    _id: 'deal_demo_003' as any,
    buyerName: 'Tolulope Bakare',
    buyerEmail: 'tolu.bakare@example.com',
    buyerPhone: '+2347098123456',
    purchasePriceKobo: 8_750_000_00,
    paidAmountKobo: 2_000_000_00,
    state: 'OFFER_LETTER_AWAITING_CLIENT',
    statusLabel: 'Awaiting Client',
    assignedAgentIds: [],
    requiresWetInkDeed: true,
    createdAt: Date.now() - 5 * 86400_000,
    updatedAt: Date.now() - 18 * 60 * 60_000,
    propertyId: 'prop_demo_003' as any,
  },
  {
    _id: 'deal_demo_004' as any,
    buyerName: 'Chinwe Adeyemi',
    buyerEmail: 'chinwe.adeyemi@example.com',
    buyerPhone: '+2348134567890',
    purchasePriceKobo: 6_200_000_00,
    paidAmountKobo: 6_200_000_00,
    state: 'COMPLETED',
    statusLabel: 'Completed',
    assignedAgentIds: [],
    requiresWetInkDeed: true,
    createdAt: Date.now() - 180 * 86400_000,
    updatedAt: Date.now() - 30 * 86400_000,
    propertyId: 'prop_demo_004' as any,
  },
  {
    _id: 'deal_demo_005' as any,
    buyerName: 'Olamide Johnson',
    buyerEmail: 'olamide.j@example.com',
    buyerPhone: '+2348023456789',
    purchasePriceKobo: 3_100_000_00,
    paidAmountKobo: 0,
    state: 'AWAITING_PAYMENT_CONFIRMATION',
    statusLabel: 'Awaiting EcoCribs',
    assignedAgentIds: [],
    requiresWetInkDeed: true,
    createdAt: Date.now() - 6 * 60 * 60_000,
    updatedAt: Date.now() - 6 * 60 * 60_000,
    propertyId: 'prop_demo_005' as any,
  },
];

export const PREVIEW_PROPERTIES: Record<string, any> = {
  prop_demo_001: {
    _id: 'prop_demo_001',
    name: 'Plot 14, The Pastures',
    estate: 'The Pastures',
    state: 'Lagos',
    lga: 'Ogombo',
    sizeSqm: 600,
    titleType: 'governors_consent',
  },
  prop_demo_002: {
    _id: 'prop_demo_002',
    name: 'Plot 27, Caribbean Lake City',
    estate: 'Caribbean Lake City',
    state: 'Lagos',
    lga: 'Sangotedo',
    sizeSqm: 1000,
    titleType: 'c_of_o',
  },
  prop_demo_003: {
    _id: 'prop_demo_003',
    name: 'Plot 8, Glory Land Estate',
    estate: 'Glory Land Estate',
    state: 'Lagos',
    lga: 'Epe',
    sizeSqm: 600,
    titleType: 'excision',
  },
  prop_demo_004: {
    _id: 'prop_demo_004',
    name: 'Plot 3, Uloma Estate',
    estate: 'Uloma Estate',
    state: 'Delta',
    lga: 'Asaba',
    sizeSqm: 500,
    titleType: 'c_of_o',
  },
  prop_demo_005: {
    _id: 'prop_demo_005',
    name: 'Plot 22, Aphric Park',
    estate: 'Aphric Park',
    state: 'Lagos',
    lga: 'Epe',
    sizeSqm: 450,
    titleType: 'gazette',
  },
};

export function previewDeal(id: string) {
  const deal = PREVIEW_DEALS.find((d) => d._id === id) ?? PREVIEW_DEALS[0]!;
  const property = PREVIEW_PROPERTIES[deal.propertyId as unknown as string];
  return {
    deal,
    property,
    documents: previewDocsForDeal(deal._id as unknown as string, deal.state),
    statusLabel: deal.statusLabel,
  };
}

function previewDocsForDeal(dealId: string, state: string) {
  const docs: any[] = [];
  const baseUpdated = Date.now() - 6 * 60 * 60_000;
  if (['RECEIPT_SENT', 'OFFER_LETTER_AWAITING_CLIENT', 'CONTRACT_AWAITING_CLIENT',
       'CONTRACT_AWAITING_WITNESS', 'CONTRACT_SIGNED', 'SURVEY_ISSUED',
       'DEED_AWAITING_CLIENT', 'DEED_AWAITING_WET_INK', 'DEED_AWAITING_WITNESS',
       'DEED_SIGNED', 'AWAITING_GOVERNORS_CONSENT', 'COMPLETED'].includes(state)) {
    docs.push({ _id: `${dealId}_receipt`, kind: 'receipt', status: 'fully_signed', updatedAt: baseUpdated - 13 * 86400_000 });
  }
  if (['OFFER_LETTER_AWAITING_CLIENT', 'CONTRACT_AWAITING_CLIENT',
       'CONTRACT_AWAITING_WITNESS', 'CONTRACT_SIGNED', 'SURVEY_ISSUED',
       'DEED_AWAITING_CLIENT', 'DEED_AWAITING_WET_INK', 'DEED_AWAITING_WITNESS',
       'DEED_SIGNED', 'AWAITING_GOVERNORS_CONSENT', 'COMPLETED'].includes(state)) {
    docs.push({ _id: `${dealId}_offer`, kind: 'offer_letter', status: state === 'OFFER_LETTER_AWAITING_CLIENT' ? 'sent' : 'fully_signed', updatedAt: baseUpdated - 10 * 86400_000 });
  }
  if (['CONTRACT_AWAITING_CLIENT', 'CONTRACT_AWAITING_WITNESS', 'CONTRACT_SIGNED',
       'SURVEY_ISSUED', 'DEED_AWAITING_CLIENT', 'DEED_AWAITING_WET_INK',
       'DEED_AWAITING_WITNESS', 'DEED_SIGNED', 'AWAITING_GOVERNORS_CONSENT', 'COMPLETED'].includes(state)) {
    docs.push({ _id: `${dealId}_contract`, kind: 'contract_of_sale',
      status: state === 'CONTRACT_AWAITING_CLIENT' ? 'sent' : state === 'CONTRACT_AWAITING_WITNESS' ? 'partially_signed' : 'fully_signed',
      updatedAt: baseUpdated - 3 * 86400_000 });
  }
  if (['SURVEY_ISSUED', 'DEED_AWAITING_CLIENT', 'DEED_AWAITING_WET_INK',
       'DEED_AWAITING_WITNESS', 'DEED_SIGNED', 'AWAITING_GOVERNORS_CONSENT', 'COMPLETED'].includes(state)) {
    docs.push({ _id: `${dealId}_survey`, kind: 'survey_plan', status: 'executed', updatedAt: baseUpdated - 2 * 86400_000 });
  }
  if (['DEED_AWAITING_CLIENT', 'DEED_AWAITING_WET_INK', 'DEED_AWAITING_WITNESS',
       'DEED_SIGNED', 'AWAITING_GOVERNORS_CONSENT', 'COMPLETED'].includes(state)) {
    docs.push({ _id: `${dealId}_deed`, kind: 'deed_of_assignment',
      status: state === 'COMPLETED' ? 'executed' : state === 'DEED_SIGNED' ? 'fully_signed' : 'sent',
      updatedAt: baseUpdated });
  }
  return docs;
}
