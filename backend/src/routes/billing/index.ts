import { FastifyInstance } from 'fastify';
import { registerGetMasterStatuses } from './get-master-statuses';
import { registerGetBillingProjects } from './get-billing-projects';
import { registerGetProjectDetail } from './get-project-detail';
import { registerPostExtraCharge } from './post-extra-charge';
import { registerPutFinaliseProject } from './put-finalise-project';
import { registerPutReconcileVendorBill } from './put-reconcile-vendor-bill';
import { registerPutPayInvoice } from './put-pay-invoice';

export * from './types';
export { getCachedMasterStatuses } from './get-master-statuses';

/**
 * Billing Module - Mounts all commercial and staged invoicing routes
 */
export async function billingRoutes(fastify: FastifyInstance) {
  // Master data
  registerGetMasterStatuses(fastify);

  // Projects list & single-pass status sub-tabs
  registerGetBillingProjects(fastify);

  // Project billing details (Milestones, Extra Charges, Vendor Bills)
  registerGetProjectDetail(fastify);

  // Extra charges insertion (60 unexpected plates, DJ overtime)
  registerPostExtraCharge(fastify);

  // Project settlement and audit finalisation
  registerPutFinaliseProject(fastify);

  // Vendor bills two-way matching reconciliation
  registerPutReconcileVendorBill(fastify);

  // Client milestone payment receipt
  registerPutPayInvoice(fastify);
}
