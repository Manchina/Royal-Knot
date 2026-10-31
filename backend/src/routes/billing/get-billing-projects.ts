import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { pool } from '../../db';
import { formatInr } from '../../utils';
import { ProjectBillingData } from './types';
import { getCachedMasterStatuses } from './get-master-statuses';

/**
 * Route: GET /api/billing/projects
 * Lists all commercial wedding projects from PostgreSQL with single-pass status sub-tab aggregation
 */
export function registerGetBillingProjects(fastify: FastifyInstance) {
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

      try {
        // Query weddings joined with clients from PostgreSQL
        const weddingsRes = await pool.query(`
          SELECT 
            w.id,
            w.code,
            c.bride_name || ' & ' || c.groom_name as couple,
            w.destination_city as city,
            w.primary_venue as venue,
            TO_CHAR(w.start_date, 'Mon DD') || ' - ' || TO_CHAR(w.end_date, 'DD, YYYY') as "startDate",
            w.estimated_guest_count as "guestCount",
            w.actual_banquet_headcount as "actualHeadcount",
            w.package_type as "packageType",
            w.status,
            w.total_budget as "totalBudget",
            w.agency_fee as "agencyFee",
            COALESCE(u.full_name, 'Devika Sharma') as coordinator
          FROM weddings w
          JOIN clients c ON w.client_id = c.id
          LEFT JOIN users u ON w.lead_planner_id = u.id
          ORDER BY w.start_date ASC
        `);

        // Query extra charges totals grouped by wedding
        const extrasRes = await pool.query(`
          SELECT 
            wedding_id,
            COALESCE(SUM(total_amount), 0) as total_extras,
            COUNT(*) as extras_count
          FROM wedding_extra_charges
          GROUP BY wedding_id
        `);
        const extrasMap = new Map(extrasRes.rows.map((r: any) => [r.wedding_id, parseFloat(r.total_extras) || 0]));
        const extrasCountMap = new Map(extrasRes.rows.map((r: any) => [r.wedding_id, parseInt(r.extras_count, 10) || 0]));

        // Query vendor bills totals grouped by wedding
        const billsRes = await pool.query(`
          SELECT 
            wedding_id,
            COALESCE(SUM(total_payable), 0) as total_payable,
            COALESCE(SUM(advance_paid), 0) as total_advance,
            COALESCE(SUM(balance_due), 0) as total_balance
          FROM vendor_bills
          GROUP BY wedding_id
        `);
        const billsMap = new Map(billsRes.rows.map((r: any) => [r.wedding_id, {
          payable: parseFloat(r.total_payable) || 0,
          advance: parseFloat(r.total_advance) || 0,
          balance: parseFloat(r.total_balance) || 0,
        }]));

        // Format into project records
        const allProjects: ProjectBillingData[] = weddingsRes.rows.map((w: any) => {
          const baseContractNum = parseFloat(w.totalBudget) || 0;
          const extrasNum = extrasMap.get(w.id) || 0;
          const extrasCount = extrasCountMap.get(w.id) || 0;
          const totalInvoicedNum = baseContractNum + extrasNum;

          const billData = billsMap.get(w.id) || {
            payable: 0,
            advance: 0,
            balance: 0,
          };

          const isFinal = w.status === 'FINALISED' || w.status === 'FINALISED_SETTLED';
          const grossMarginNum = totalInvoicedNum > 0 ? ((totalInvoicedNum - billData.payable) / totalInvoicedNum) * 100 : 0;

          return {
            id: w.id,
            code: w.code,
            couple: w.couple,
            city: w.city,
            venue: w.venue,
            startDate: w.startDate,
            guestCount: w.actualHeadcount || w.guestCount,
            packageType: w.packageType,
            status: w.status as any,
            isFinalised: isFinal,
            finalisedDate: isFinal ? 'Feb 2026' : undefined,
            finalisedBy: isFinal ? 'Aditya Singhal (Super Admin)' : undefined,
            budget: `₹${(baseContractNum / 10000000).toFixed(2)} Cr`,
            coordinator: w.coordinator || 'Devika Sharma',
            baseContract: formatInr(baseContractNum),
            totalExtras: extrasNum > 0 ? `+${extrasCount} (${formatInr(extrasNum)})` : 'None',
            totalInvoiced: formatInr(totalInvoicedNum),
            vendorAdvancePaid: formatInr(billData.advance),
            vendorBalanceDue: isFinal && w.status === 'FINALISED_SETTLED' ? '₹0 (Settled)' : formatInr(billData.balance),
            grossMargin: `${grossMarginNum.toFixed(1)}%`,
            extraCharges: [],
            vendorBills: [],
            invoices: [],
          };
        });

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

        for (let i = 0; i < allProjects.length; i++) {
          const p = allProjects[i];

          // Search filter
          if (normalizedSearch) {
            const match =
              p.code.toLowerCase().includes(normalizedSearch) ||
              p.couple.toLowerCase().includes(normalizedSearch) ||
              p.venue.toLowerCase().includes(normalizedSearch) ||
              p.city.toLowerCase().includes(normalizedSearch);
            if (!match) continue;
          }

          if (p.isFinalised) {
            finalisedAll.push(p);
            counts.ALL_FINALISED++;
            counts[p.status] = (counts[p.status] || 0) + 1;
          } else {
            ongoingAll.push(p);
            counts.ALL_ONGOING++;
            counts[p.status] = (counts[p.status] || 0) + 1;
          }
        }

        // Fetch master status labels dynamically from PostgreSQL
        const masterStatuses = await getCachedMasterStatuses();
        const masterLabelMap = new Map(masterStatuses.map((m) => [m.optionKey, m.label]));

        // Status sub-tabs definition matching PeopleFirst standard
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
            count: allProjects.filter((p) => !p.isFinalised).length,
          },
          {
            id: 'finalised',
            label: 'Finalised Projects',
            count: allProjects.filter((p) => p.isFinalised).length,
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
      } catch (err: any) {
        reply.status(500);
        return {
          success: false,
          error: err.message,
        };
      }
    }
  );
}
