import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { pool } from '../db';

export interface ExtraChargeItem {
  id: string;
  category: string;
  description: string;
  qty: number;
  unitPrice: string;
  total: string;
  vendor: string;
  status: 'ADDED_TO_CLIENT_INVOICE' | 'PENDING_APPROVAL';
  approvedBy: string;
  lastEditedAt?: string;
  editHistory?: Array<{
    date: string;
    action: string;
    by: string;
    details: string;
  }>;
}

export interface VendorDisbursementItem {
  vendor: string;
  category: string;
  agreedBase: string;
  extras: string;
  totalPayable: string;
  advancePaid: string;
  balanceDue: string;
  status: 'RECONCILED_MATCHED' | 'SETTLEMENT_CLEARED' | 'DISPUTED';
}

export interface ProjectBillingData {
  id: string;
  code: string;
  couple: string;
  city: string;
  venue: string;
  startDate: string;
  guestCount: number;
  packageType: string;
  status: 'LIVE_BIG_DAY' | 'IN_PLANNING' | 'BOOKED' | 'FINALISED' | 'FINALISED_SETTLED';
  isFinalised: boolean;
  finalisedDate?: string;
  finalisedBy?: string;
  budget: string;
  coordinator: string;
  baseContract: string;
  totalExtras: string;
  totalInvoiced: string;
  vendorAdvancePaid: string;
  vendorBalanceDue: string;
  grossMargin: string;
  extraCharges: ExtraChargeItem[];
  vendorBills: VendorDisbursementItem[];
}

// In-memory initial data for wedding billing projects (Ongoing + Finalised)
let BILLING_PROJECTS: ProjectBillingData[] = [
  {
    id: 'RW-2026-001',
    code: 'RW-2026-001',
    couple: 'Aanya Singhania & Raghav Mehra',
    city: 'Udaipur',
    venue: 'The Oberoi Udaivilas',
    startDate: 'Dec 10 - 13, 2026',
    guestCount: 400,
    packageType: 'Full-Service Royal Wedding',
    status: 'LIVE_BIG_DAY',
    isFinalised: false,
    budget: '₹3.50 Cr',
    coordinator: 'Karan Verma',
    baseContract: '₹3,50,00,000',
    totalExtras: '₹1,56,000',
    totalInvoiced: '₹3,51,56,000',
    vendorAdvancePaid: '₹1,47,00,000',
    vendorBalanceDue: '₹14,51,000',
    grossMargin: '22.4%',
    extraCharges: [
      {
        id: 'EXT-01',
        category: 'EXTRA_PLATES',
        description: '60 Unexpected Guests turned up at the Grand Durbar Banquet',
        qty: 60,
        unitPrice: '₹2,100 / plate',
        total: '₹1,26,000',
        vendor: 'Marwar Gourmet Kitchens',
        status: 'ADDED_TO_CLIENT_INVOICE',
        approvedBy: 'Finance Manager',
        lastEditedAt: '2026-10-30T18:00:00Z',
        editHistory: [
          {
            date: '2026-10-30T18:00:00Z',
            action: 'HEADCOUNT_ADJUSTMENT',
            by: 'Lead Planner Devika',
            details: 'Adjusted from 50 to 60 extra covers verified with kitchen captain',
          },
        ],
      },
      {
        id: 'EXT-02',
        category: 'DJ_OVERTIME',
        description: 'Sangeet party extended by 2.5 hours past 01:00 AM curfew',
        qty: 2.5,
        unitPrice: '₹12,000 / hr',
        total: '₹30,000',
        vendor: 'Desert Beat Sounds',
        status: 'ADDED_TO_CLIENT_INVOICE',
        approvedBy: 'Lead Planner',
      },
    ],
    vendorBills: [
      {
        vendor: 'Marwar Gourmet Kitchens',
        category: 'Catering & Banquets',
        agreedBase: '₹8,40,000',
        extras: '+₹1,26,000 (60 Plates)',
        totalPayable: '₹9,66,000',
        advancePaid: '₹4,20,000',
        balanceDue: '₹5,46,000',
        status: 'RECONCILED_MATCHED',
      },
      {
        vendor: 'Jaipur Floral Wonders',
        category: 'Mandap & Courtyard Decor',
        agreedBase: '₹14,00,000',
        extras: '₹0',
        totalPayable: '₹14,00,000',
        advancePaid: '₹7,00,000',
        balanceDue: '₹7,00,000',
        status: 'RECONCILED_MATCHED',
      },
      {
        vendor: 'Desert Beat Sounds',
        category: 'Sound & DJ Tech Rider',
        agreedBase: '₹3,50,000',
        extras: '+₹30,000 (Overtime)',
        totalPayable: '₹3,80,000',
        advancePaid: '₹1,75,000',
        balanceDue: '₹2,05,000',
        status: 'RECONCILED_MATCHED',
      },
    ],
  },
  {
    id: 'RW-2026-002',
    code: 'RW-2026-002',
    couple: 'Kriti Maheshwari & Siddharth Jain',
    city: 'Jaipur',
    venue: 'Rambagh Palace',
    startDate: 'Nov 20 - 23, 2026',
    guestCount: 420,
    packageType: 'Full-Service Royal Wedding',
    status: 'IN_PLANNING',
    isFinalised: false,
    budget: '₹2.75 Cr',
    coordinator: 'Devika Sharma',
    baseContract: '₹2,75,00,000',
    totalExtras: '₹85,000',
    totalInvoiced: '₹2,75,85,000',
    vendorAdvancePaid: '₹98,50,000',
    vendorBalanceDue: '₹8,75,000',
    grossMargin: '24.1%',
    extraCharges: [
      {
        id: 'EXT-01',
        category: 'VINTAGE_CAR',
        description: 'Vintage Rolls Royce Phantom for Groom Baraat entry',
        qty: 1,
        unitPrice: '₹55,000 / day',
        total: '₹55,000',
        vendor: 'Royal Rajputana Fleet',
        status: 'ADDED_TO_CLIENT_INVOICE',
        approvedBy: 'Devika Sharma',
      },
      {
        id: 'EXT-02',
        category: 'ADDITIONAL_POWER',
        description: 'Silent Diesel Generator backup (125 kVA) for palace lawn',
        qty: 2,
        unitPrice: '₹15,000 / unit',
        total: '₹30,000',
        vendor: 'Jaipur Power Grid Rentals',
        status: 'ADDED_TO_CLIENT_INVOICE',
        approvedBy: 'Devika Sharma',
      },
    ],
    vendorBills: [
      {
        vendor: 'Royal Rajputana Fleet',
        category: 'Luxury Transport & Baraat',
        agreedBase: '₹2,20,000',
        extras: '+₹55,000 (Vintage Car)',
        totalPayable: '₹2,75,000',
        advancePaid: '₹1,50,000',
        balanceDue: '₹1,25,000',
        status: 'RECONCILED_MATCHED',
      },
      {
        vendor: 'Jaipur Power Grid Rentals',
        category: 'Technical & Infrastructure',
        agreedBase: '₹1,80,000',
        extras: '+₹30,000 (Genset)',
        totalPayable: '₹2,10,000',
        advancePaid: '₹1,00,000',
        balanceDue: '₹1,10,000',
        status: 'RECONCILED_MATCHED',
      },
    ],
  },
  {
    id: 'RW-2026-003',
    code: 'RW-2026-003',
    couple: 'Simran Bajaj & Armaan Gill',
    city: 'Jaipur',
    venue: 'Alila Fort Bishangarh',
    startDate: 'Jan 14 - 17, 2027',
    guestCount: 500,
    packageType: 'Day-of Execution',
    status: 'BOOKED',
    isFinalised: false,
    budget: '₹3.00 Cr',
    coordinator: 'Karan Verma',
    baseContract: '₹3,00,00,000',
    totalExtras: '₹0',
    totalInvoiced: '₹3,00,00,000',
    vendorAdvancePaid: '₹60,00,000',
    vendorBalanceDue: '₹0',
    grossMargin: '21.0%',
    extraCharges: [],
    vendorBills: [
      {
        vendor: 'Bishangarh Hospitality',
        category: 'Fort Venue & Banquets',
        agreedBase: '₹22,00,000',
        extras: '₹0',
        totalPayable: '₹22,00,000',
        advancePaid: '₹11,00,000',
        balanceDue: '₹11,00,000',
        status: 'RECONCILED_MATCHED',
      },
    ],
  },
  // Finalised Projects (Audited and locked with edit history)
  {
    id: 'RW-2025-010',
    code: 'RW-2025-010',
    couple: 'Pooja Agarwal & Rohan Kapoor',
    city: 'Jodhpur',
    venue: 'Umaid Bhawan Palace',
    startDate: 'Feb 12 - 15, 2026',
    guestCount: 450,
    packageType: 'Heritage Royal Extravaganza',
    status: 'FINALISED_SETTLED',
    isFinalised: true,
    finalisedDate: 'Feb 20, 2026',
    finalisedBy: 'Aditya Singhal (Super Admin)',
    budget: '₹4.20 Cr',
    coordinator: 'Devika Sharma',
    baseContract: '₹4,20,00,000',
    totalExtras: '₹3,40,000',
    totalInvoiced: '₹4,23,40,000',
    vendorAdvancePaid: '₹2,10,00,000',
    vendorBalanceDue: '₹0',
    grossMargin: '26.8%',
    extraCharges: [
      {
        id: 'EXT-01',
        category: 'SPECIAL_FIREWORKS',
        description: 'Green Eco-Friendly Pyro Show over palace dome during Varmala',
        qty: 1,
        unitPrice: '₹1,90,000',
        total: '₹1,90,000',
        vendor: 'Rajputana Pyro Arts',
        status: 'ADDED_TO_CLIENT_INVOICE',
        approvedBy: 'Devika Sharma',
        lastEditedAt: '2026-02-18T14:30:00Z',
        editHistory: [
          {
            date: '2026-02-18T14:30:00Z',
            action: 'DISCOUNT_REVISION',
            by: 'Founder Aditya',
            details: 'Negotiated ₹10,000 vendor volume discount applied to final billing',
          },
        ],
      },
      {
        id: 'EXT-02',
        category: 'ROYAL_PROCESSION',
        description: '4 Dappled Marwari Horses with silver ceremonial saddlery',
        qty: 4,
        unitPrice: '₹37,500 / horse',
        total: '₹1,50,000',
        vendor: 'Jodhpur Royal Stables',
        status: 'ADDED_TO_CLIENT_INVOICE',
        approvedBy: 'Devika Sharma',
      },
    ],
    vendorBills: [
      {
        vendor: 'Rajputana Pyro Arts',
        category: 'Special Effects & Pyros',
        agreedBase: '₹3,00,000',
        extras: '+₹1,90,000 (Palace Pyro)',
        totalPayable: '₹4,90,000',
        advancePaid: '₹4,90,000',
        balanceDue: '₹0 (Settled)',
        status: 'SETTLEMENT_CLEARED',
      },
      {
        vendor: 'Jodhpur Royal Stables',
        category: 'Baraat Royal Regalia',
        agreedBase: '₹2,50,000',
        extras: '+₹1,50,000 (Marwari Horses)',
        totalPayable: '₹4,00,000',
        advancePaid: '₹4,00,000',
        balanceDue: '₹0 (Settled)',
        status: 'SETTLEMENT_CLEARED',
      },
    ],
  },
  {
    id: 'RW-2025-011',
    code: 'RW-2025-011',
    couple: 'Meera Singhal & Arjun Chawla',
    city: 'Udaipur',
    venue: 'Taj Lake Palace',
    startDate: 'Jan 22 - 25, 2026',
    guestCount: 350,
    packageType: 'Bespoke Island Wedding',
    status: 'FINALISED',
    isFinalised: true,
    finalisedDate: 'Feb 05, 2026',
    finalisedBy: 'Karan Verma (Lead Planner)',
    budget: '₹3.80 Cr',
    coordinator: 'Karan Verma',
    baseContract: '₹3,80,00,000',
    totalExtras: '₹2,10,000',
    totalInvoiced: '₹3,82,10,000',
    vendorAdvancePaid: '₹1,85,00,000',
    vendorBalanceDue: '₹0',
    grossMargin: '25.2%',
    extraCharges: [
      {
        id: 'EXT-01',
        category: 'BOAT_SHUTTLE_OVERRUN',
        description: 'Extra lake speedboats running till 03:00 AM for guests',
        qty: 6,
        unitPrice: '₹35,000 / boat-hr',
        total: '₹2,10,000',
        vendor: 'Lake Pichola Royal Charters',
        status: 'ADDED_TO_CLIENT_INVOICE',
        approvedBy: 'Karan Verma',
        lastEditedAt: '2026-02-04T11:00:00Z',
        editHistory: [
          {
            date: '2026-02-04T11:00:00Z',
            action: 'FUEL_SURCHARGE_WAIVER',
            by: 'Karan Verma',
            details: 'Waved midnight fuel surcharge as per season contract clause',
          },
        ],
      },
    ],
    vendorBills: [
      {
        vendor: 'Lake Pichola Royal Charters',
        category: 'Water Transport & Ferry Logistics',
        agreedBase: '₹6,50,000',
        extras: '+₹2,10,000 (Midnight Ferry)',
        totalPayable: '₹8,60,000',
        advancePaid: '₹8,60,000',
        balanceDue: '₹0 (Settled)',
        status: 'SETTLEMENT_CLEARED',
      },
    ],
  },
];

// In-memory cache for master options with 60-second TTL for sub-millisecond lookups
interface MasterOptionRow {
  id: string;
  category: string;
  optionKey: string;
  label: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
}

let cachedMasterStatuses: MasterOptionRow[] | null = null;
let masterStatusesCacheTime = 0;
const MASTER_STATUSES_CACHE_TTL_MS = 60_000;

async function getCachedMasterStatuses(): Promise<MasterOptionRow[]> {
  const now = Date.now();
  if (cachedMasterStatuses && now - masterStatusesCacheTime < MASTER_STATUSES_CACHE_TTL_MS) {
    return cachedMasterStatuses;
  }

  try {
    const res = await pool.query(
      `SELECT id, category, option_key as "optionKey", label, description, sort_order as "sortOrder", is_active as "isActive"
       FROM master_options
       WHERE category = 'WEDDING_STATUS' AND is_active = true
       ORDER BY sort_order ASC`
    );
    cachedMasterStatuses = res.rows;
    masterStatusesCacheTime = now;
    return res.rows;
  } catch (err: any) {
    // If DB is temporarily busy, fallback to cached or default
    if (cachedMasterStatuses) return cachedMasterStatuses;
    return [
      { id: '1', category: 'WEDDING_STATUS', optionKey: 'LIVE_BIG_DAY', label: 'Live Big Day', description: null, sortOrder: 1, isActive: true },
      { id: '2', category: 'WEDDING_STATUS', optionKey: 'IN_PLANNING', label: 'In Planning', description: null, sortOrder: 2, isActive: true },
      { id: '3', category: 'WEDDING_STATUS', optionKey: 'BOOKED', label: 'Booked', description: null, sortOrder: 3, isActive: true },
      { id: '4', category: 'WEDDING_STATUS', optionKey: 'FINALISED', label: 'Finalised & Audited', description: null, sortOrder: 4, isActive: true },
    ];
  }
}

export async function billingRoutes(fastify: FastifyInstance) {
  // GET /api/billing/master-statuses - Fetch dynamic WEDDING_STATUS master data from PostgreSQL (sub-millisecond with cache)
  fastify.get('/master-statuses', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await getCachedMasterStatuses();
      reply.header('Cache-Control', 'public, max-age=60');
      return {
        success: true,
        data,
      };
    } catch (err: any) {
      reply.status(500);
      return {
        success: false,
        error: err.message,
      };
    }
  });

  // GET /api/billing/projects - List projects partitioned by PeopleFirst tabs (ongoing & finalised) with status subtabs
  fastify.get(
    '/projects',
    async (
      request: FastifyRequest<{
        Querystring: { tab?: string; status?: string; search?: string };
      }>,
      reply: FastifyReply
    ) => {
      const { tab = 'ongoing', status = 'ALL', search = '' } = request.query;
      const normalizedSearch = search.trim().toLowerCase();

      // High-performance single-pass partition, filter, and aggregation
      const counts: Record<string, number> = {
        ALL_ONGOING: 0,
        ALL_FINALISED: 0,
        LIVE_BIG_DAY: 0,
        IN_PLANNING: 0,
        BOOKED: 0,
        FINALISED: 0,
        FINALISED_SETTLED: 0,
      };

      const ongoingAll: ProjectBillingData[] = [];
      const finalisedAll: ProjectBillingData[] = [];

      for (let i = 0; i < BILLING_PROJECTS.length; i++) {
        const p = BILLING_PROJECTS[i];

        // Search check
        if (normalizedSearch) {
          const match =
            p.code.toLowerCase().includes(normalizedSearch) ||
            p.couple.toLowerCase().includes(normalizedSearch) ||
            p.venue.toLowerCase().includes(normalizedSearch) ||
            p.city.toLowerCase().includes(normalizedSearch);
          if (!match) continue;
        }

        if (p.isFinalised || p.status === 'FINALISED' || p.status === 'FINALISED_SETTLED') {
          finalisedAll.push(p);
          counts.ALL_FINALISED++;
          counts[p.status] = (counts[p.status] || 0) + 1;
        } else {
          ongoingAll.push(p);
          counts.ALL_ONGOING++;
          counts[p.status] = (counts[p.status] || 0) + 1;
        }
      }

      // Fetch master status labels dynamically from cache/Postgres
      const masterStatuses = await getCachedMasterStatuses();
      const masterLabelMap = new Map(masterStatuses.map((m) => [m.optionKey, m.label]));

      // Status subtabs definition matching PeopleFirst standard
      const ongoingStatusTabs = [
        { id: 'ALL', label: 'All', count: counts.ALL_ONGOING },
        { id: 'LIVE_BIG_DAY', label: masterLabelMap.get('LIVE_BIG_DAY') || 'Live Big Day', count: counts.LIVE_BIG_DAY || 0 },
        { id: 'IN_PLANNING', label: masterLabelMap.get('IN_PLANNING') || 'In Planning', count: counts.IN_PLANNING || 0 },
        { id: 'BOOKED', label: masterLabelMap.get('BOOKED') || 'Booked', count: counts.BOOKED || 0 },
      ];

      const finalisedStatusTabs = [
        { id: 'ALL', label: 'All', count: counts.ALL_FINALISED },
        { id: 'FINALISED', label: masterLabelMap.get('FINALISED') || 'Finalised', count: counts.FINALISED || 0 },
        { id: 'FINALISED_SETTLED', label: masterLabelMap.get('FINALISED_SETTLED') || 'Finalised & Settled', count: counts.FINALISED_SETTLED || 0 },
      ];

      // Filter active list based on selected status subtab
      let activeList: ProjectBillingData[];
      if (tab === 'ongoing') {
        activeList = status === 'ALL' ? ongoingAll : ongoingAll.filter((p) => p.status === status);
      } else {
        activeList = status === 'ALL' ? finalisedAll : finalisedAll.filter((p) => p.status === status);
      }

      const tabs = [
        {
          id: 'ongoing',
          label: 'Ongoing Projects',
          count: BILLING_PROJECTS.filter((p) => !p.isFinalised).length,
        },
        {
          id: 'finalised',
          label: 'Finalised Projects',
          count: BILLING_PROJECTS.filter((p) => p.isFinalised).length,
        },
      ];

      reply.header('Cache-Control', 'private, max-age=2');

      return {
        success: true,
        tabs,
        activeTab: tab,
        activeStatus: status,
        statusTabs: tab === 'ongoing' ? ongoingStatusTabs : finalisedStatusTabs,
        data: {
          ongoing: ongoingAll,
          finalised: finalisedAll,
          activeList,
        },
      };
    }
  );

  // GET /api/billing/projects/:id - Get detailed billing data for a specific project
  fastify.get('/projects/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const project = BILLING_PROJECTS.find((p) => p.id === id || p.code === id);

    if (!project) {
      reply.status(404);
      return {
        success: false,
        message: `Project ${id} not found`,
      };
    }

    return {
      success: true,
      data: project,
    };
  });

  // POST /api/billing/projects/:id/extras - Add an extra charge to a project
  fastify.post(
    '/projects/:id/extras',
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: {
          category: string;
          description: string;
          qty: number;
          unitPrice: string;
          vendor: string;
        };
      }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      const { category, description, qty, unitPrice, vendor } = request.body || {};

      const projectIndex = BILLING_PROJECTS.findIndex((p) => p.id === id || p.code === id);
      if (projectIndex === -1) {
        reply.status(404);
        return { success: false, message: `Project ${id} not found` };
      }

      const project = BILLING_PROJECTS[projectIndex];
      const numQty = Number(qty) || 1;
      const numPrice = Number(unitPrice.replace(/[^\d.]/g, '')) || 1000;
      const calcTotal = numQty * numPrice;

      const newExtra: ExtraChargeItem = {
        id: `EXT-0${project.extraCharges.length + 1}`,
        category: category || 'OVERRUN_ADDITION',
        description,
        qty: numQty,
        unitPrice: `₹${numPrice.toLocaleString('en-IN')}`,
        total: `₹${calcTotal.toLocaleString('en-IN')}`,
        vendor: vendor || 'Preferred Vendor',
        status: 'ADDED_TO_CLIENT_INVOICE',
        approvedBy: 'Finance Manager',
      };

      project.extraCharges.push(newExtra);

      // Recalculate project totals
      const currentExtrasSum = project.extraCharges.reduce((acc, curr) => {
        const val = Number(curr.total.replace(/[^\d.]/g, '')) || 0;
        return acc + val;
      }, 0);
      project.totalExtras = `₹${currentExtrasSum.toLocaleString('en-IN')}`;

      return {
        success: true,
        message: 'Extra charge successfully added to project invoice',
        extra: newExtra,
        project,
      };
    }
  );

  // PUT /api/billing/projects/:id/finalise - Finalise and lock settlement for a project
  fastify.put('/projects/:id/finalise', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const project = BILLING_PROJECTS.find((p) => p.id === id || p.code === id);

    if (!project) {
      reply.status(404);
      return { success: false, message: `Project ${id} not found` };
    }

    project.isFinalised = true;
    project.status = 'FINALISED';
    project.finalisedDate = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    project.finalisedBy = 'Aditya Singhal (Super Admin)';

    // Mark vendor balances as settled cleared
    project.vendorBills = project.vendorBills.map((vb) => ({
      ...vb,
      balanceDue: '₹0 (Settled)',
      status: 'SETTLEMENT_CLEARED',
    }));

    return {
      success: true,
      message: `Project ${project.code} has been successfully finalised and audited!`,
      project,
    };
  });
}
