import { FastifyInstance } from 'fastify';
import { registerPostCreateEnquiry } from './post-create-enquiry';
import { registerGetAllEnquiries } from './get-all-enquiries';
import { registerGetEnquiryById } from './get-enquiry-by-id';
import { registerPatchEnquiryStatus } from './patch-enquiry-status';
import { registerPostConvertEnquiry } from './post-convert-enquiry';
import { registerGetEnquiryLogs } from './get-enquiry-logs';
import { registerPostEnquiryLog } from './post-enquiry-log';

export * from './types';

/**
 * Enquiries Module - Mounts client consultation intake, agreements and conversion routes
 */
export async function enquiryRoutes(fastify: FastifyInstance) {
  registerPostCreateEnquiry(fastify);
  registerGetAllEnquiries(fastify);
  registerGetEnquiryById(fastify);
  registerPatchEnquiryStatus(fastify);
  registerPostConvertEnquiry(fastify);
  registerGetEnquiryLogs(fastify);
  registerPostEnquiryLog(fastify);
}
