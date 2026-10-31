import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../../db';
import { enquiries, enquiryChangeLogs } from '../../db/schema';
import { matchEnquiry, UpdateStatusBody } from './types';

/**
 * Route: PATCH /api/enquiries/:id/status
 * Updates enquiry status or records digital signature from mobile magic link
 */
export function registerPatchEnquiryStatus(fastify: FastifyInstance) {
  fastify.patch('/:id/status', async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateStatusBody }>, reply: FastifyReply) => {
    const { id } = request.params;
    const { status, agreementStatus, notes, signatoryName, userId } = request.body || {};

    try {
      const isSigned = agreementStatus === 'Signed on Mobile';

      const updateValues: any = {
        updatedAt: new Date(),
      };
      if (status) updateValues.status = status;
      if (agreementStatus) updateValues.agreementStatus = agreementStatus;
      if (isSigned) updateValues.agreementSignedAt = new Date();
      if (signatoryName) updateValues.primaryContactName = signatoryName;
      if (notes !== undefined) updateValues.notes = notes;

      const [updated] = await db
        .update(enquiries)
        .set(updateValues)
        .where(matchEnquiry(id))
        .returning();

      if (!updated) {
        reply.status(404);
        return { success: false, message: 'Enquiry not found.' };
      }

      const isSent = agreementStatus === 'Sent - Pending Signature';

      let action = 'STATUS_UPDATED';
      let logNotes = `Status updated to "${updated.status}". ${notes || ''}`;
      const performedBy = signatoryName
        ? `${signatoryName}${userId ? ` (UID: ${userId})` : ''} (Authorized Signatory)`
        : isSigned
        ? `Client${userId ? ` (UID: ${userId})` : ''} (Mobile Magic Link)`
        : 'Lead Planner (Devika Sharma)';

      if (isSigned) {
        action = 'AGREEMENT_SIGNED';
        logNotes = signatoryName
          ? `Client (${signatoryName}${userId ? `, UID: ${userId}` : ''}) reviewed and digitally signed royal wedding agreement via mobile magic link.`
          : `Client${userId ? ` (UID: ${userId})` : ''} reviewed and digitally signed royal wedding agreement via mobile magic link.`;
      } else if (isSent) {
        action = 'AGREEMENT_SENT';
        logNotes = `Wedding service agreement generated and magic signing link dispatched to client via email & mobile.${userId ? ` (UID: ${userId})` : ''}`;
      }

      // Record audit change log
      try {
        await db.insert(enquiryChangeLogs).values({
          enquiryId: updated.id,
          action,
          fromStatus: null,
          toStatus: updated.status,
          performedBy,
          notes: logNotes,
        });
      } catch (logErr: any) {
        fastify.log.warn(`Change log insert error: ${logErr.message}`);
      }

      return {
        success: true,
        message: 'Enquiry updated successfully via Drizzle ORM.',
        data: updated,
      };
    } catch (err: any) {
      fastify.log.error(`Drizzle enquiry status update error: ${err.message}`);
      reply.status(500);
      return { success: false, error: err.message };
    }
  });
}
