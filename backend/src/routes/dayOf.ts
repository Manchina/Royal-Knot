import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db';
import { dayOfRunSheet, dayOfVendorCheckins, dayOfIncidents, weddings, users, vendors, weddingEvents } from '../db/schema';
import { eq, desc, asc, and, ilike, or, sql } from 'drizzle-orm';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveWeddingId(weddingIdOrCode?: string): Promise<string | null> {
  if (!weddingIdOrCode || weddingIdOrCode === 'ALL') {
    return null;
  }

  const trimmed = weddingIdOrCode.trim();
  if (UUID_REGEX.test(trimmed)) {
    const found = await db
      .select({ id: weddings.id })
      .from(weddings)
      .where(eq(weddings.id, trimmed))
      .limit(1);
    return found.length ? found[0].id : null;
  }

  const foundByCode = await db
    .select({ id: weddings.id })
    .from(weddings)
    .where(eq(weddings.code, trimmed))
    .limit(1);
  return foundByCode.length ? foundByCode[0].id : null;
}

export async function dayOfRoutes(fastify: FastifyInstance) {
  // ==========================================================================
  // SECTION 1: MINUTE-BY-MINUTE RUN SHEET
  // ==========================================================================

  // GET /api/day-of/run-sheet
  fastify.get('/run-sheet', async (request: FastifyRequest<{ Querystring: { weddingId?: string } }>, reply: FastifyReply) => {
    const { weddingId } = request.query;

    try {
      const targetWeddingId = await resolveWeddingId(weddingId);
      if (!targetWeddingId) {
        return { success: true, data: [] };
      }

      const rows = await db
        .select({
          id: dayOfRunSheet.id,
          weddingId: dayOfRunSheet.weddingId,
          weddingCode: weddings.code,
          weddingStartDate: weddings.startDate,
          weddingEndDate: weddings.endDate,
          eventId: dayOfRunSheet.eventId,
          timeSlot: dayOfRunSheet.timeSlot,
          activityTitle: dayOfRunSheet.activityTitle,
          location: dayOfRunSheet.location,
          responsibleUserId: dayOfRunSheet.responsibleUserId,
          owner: users.fullName,
          ownerRole: users.role,
          notes: dayOfRunSheet.notes,
          sortOrder: dayOfRunSheet.sortOrder,
        })
        .from(dayOfRunSheet)
        .innerJoin(weddings, eq(dayOfRunSheet.weddingId, weddings.id))
        .leftJoin(users, eq(dayOfRunSheet.responsibleUserId, users.id))
        .where(eq(dayOfRunSheet.weddingId, targetWeddingId))
        .orderBy(asc(dayOfRunSheet.timeSlot), asc(dayOfRunSheet.sortOrder));

      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTotalMin = currentHours * 60 + currentMinutes;

      const data = rows.map((r) => {
        const timeFormatted = r.timeSlot.slice(0, 5); // '14:00'
        const [h, m] = timeFormatted.split(':').map(Number);
        const slotTotalMin = (h || 0) * 60 + (m || 0);

        // Check if explicit status is recorded in notes tag [STATUS:XXX]
        const statusMatch = r.notes?.match(/\[STATUS:([A-Z_]+)\]/);
        let status: 'COMPLETED' | 'IN_PROGRESS' | 'UPCOMING' = 'UPCOMING';

        if (statusMatch && ['COMPLETED', 'IN_PROGRESS', 'UPCOMING'].includes(statusMatch[1])) {
          status = statusMatch[1] as 'COMPLETED' | 'IN_PROGRESS' | 'UPCOMING';
        } else {
          // If no explicit tag, resolve contextual status based on wedding date
          const todayStr = now.toISOString().split('T')[0];
          const startStr = r.weddingStartDate ? new Date(r.weddingStartDate).toISOString().split('T')[0] : null;
          const endStr = r.weddingEndDate ? new Date(r.weddingEndDate).toISOString().split('T')[0] : null;

          if (startStr && todayStr < startStr) {
            // Future wedding -> items are upcoming by definition
            status = 'UPCOMING';
          } else if (endStr && todayStr > endStr) {
            // Past wedding -> concluded
            status = 'COMPLETED';
          } else {
            // Event is today -> live minute-by-minute timeline evaluation
            if (currentTotalMin > slotTotalMin + 60) {
              status = 'COMPLETED';
            } else if (currentTotalMin >= slotTotalMin && currentTotalMin <= slotTotalMin + 60) {
              status = 'IN_PROGRESS';
            } else {
              status = 'UPCOMING';
            }
          }
        }

        const cleanNotes = r.notes?.replace(/\[STATUS:[A-Z_]+\]/g, '').trim() || null;

        return {
          id: r.id,
          weddingId: r.weddingId,
          weddingCode: r.weddingCode,
          time: timeFormatted,
          timeSlot: r.timeSlot,
          event: r.activityTitle,
          activityTitle: r.activityTitle,
          venue: r.location || 'Palace Grounds',
          location: r.location,
          responsibleUserId: r.responsibleUserId,
          owner: r.owner || 'Day-of Coordinator',
          ownerRole: r.ownerRole,
          notes: cleanNotes,
          sortOrder: r.sortOrder,
          status,
        };
      });

      return {
        success: true,
        data,
        total: data.length,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      fastify.log.error(err);
      reply.status(500);
      return { success: false, message: 'Failed to fetch run sheet', error: msg };
    }
  });

  // POST /api/day-of/run-sheet
  fastify.post('/run-sheet', async (request: FastifyRequest<{
    Body: {
      weddingId: string;
      timeSlot?: string;
      time?: string;
      activityTitle?: string;
      event?: string;
      location?: string;
      venue?: string;
      responsibleUserId?: string;
      ownerName?: string;
      notes?: string;
      status?: 'COMPLETED' | 'IN_PROGRESS' | 'UPCOMING';
    }
  }>, reply: FastifyReply) => {
    const {
      weddingId,
      timeSlot,
      time: inputTime,
      activityTitle,
      event: inputEvent,
      location,
      venue,
      responsibleUserId,
      ownerName,
      notes = '',
      status = 'UPCOMING',
    } = request.body || {};

    const finalTitle = (activityTitle || inputEvent || '').trim();
    const rawTime = (timeSlot || inputTime || '12:00').trim();

    if (!weddingId || !finalTitle) {
      reply.status(400);
      return { success: false, message: 'weddingId and activity title are required.' };
    }

    try {
      const targetWeddingId = await resolveWeddingId(weddingId);
      if (!targetWeddingId) {
        reply.status(404);
        return { success: false, message: `Wedding '${weddingId}' not found.` };
      }

      // Format timeSlot to HH:MM:00
      let formattedTime = rawTime;
      if (formattedTime.length === 5) {
        formattedTime = `${formattedTime}:00`;
      }

      // Resolve responsible user ID
      let finalUserId = responsibleUserId && UUID_REGEX.test(responsibleUserId) ? responsibleUserId : null;
      if (!finalUserId && ownerName?.trim()) {
        const found = await db
          .select({ id: users.id })
          .from(users)
          .where(ilike(sql`${users.fullName}`, `%${ownerName.trim()}%`))
          .limit(1);
        if (found.length) {
          finalUserId = found[0].id;
        }
      }

      const cleanNotes = notes.replace(/\[STATUS:[A-Z_]+\]/g, '').trim();
      const taggedNotes = `[STATUS:${status}] ${cleanNotes}`.trim();

      const [created] = await db
        .insert(dayOfRunSheet)
        .values({
          weddingId: targetWeddingId,
          timeSlot: formattedTime,
          activityTitle: finalTitle,
          location: (location || venue || 'Palace Hall').trim(),
          responsibleUserId: finalUserId,
          notes: taggedNotes || null,
        })
        .returning();

      return {
        success: true,
        message: 'Run sheet item created successfully',
        data: created,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      fastify.log.error(err);
      reply.status(500);
      return { success: false, message: 'Failed to create run sheet item', error: msg };
    }
  });

  // PATCH /api/day-of/run-sheet/:id
  fastify.patch('/run-sheet/:id', async (request: FastifyRequest<{
    Params: { id: string };
    Body: {
      timeSlot?: string;
      activityTitle?: string;
      location?: string;
      responsibleUserId?: string;
      notes?: string;
      status?: 'COMPLETED' | 'IN_PROGRESS' | 'UPCOMING';
    };
  }>, reply: FastifyReply) => {
    const { id } = request.params;
    const { timeSlot, activityTitle, location, responsibleUserId, notes, status } = request.body || {};

    if (!UUID_REGEX.test(id)) {
      reply.status(400);
      return { success: false, message: 'Invalid run sheet UUID.' };
    }

    try {
      const updateData: Partial<typeof dayOfRunSheet.$inferInsert> = {};
      if (timeSlot !== undefined) {
        updateData.timeSlot = timeSlot.length === 5 ? `${timeSlot}:00` : timeSlot;
      }
      if (activityTitle !== undefined) updateData.activityTitle = activityTitle.trim();
      if (location !== undefined) updateData.location = location.trim();
      if (responsibleUserId !== undefined) {
        updateData.responsibleUserId = responsibleUserId && UUID_REGEX.test(responsibleUserId) ? responsibleUserId : null;
      }

      if (status !== undefined) {
        let currentNotes = notes !== undefined ? notes : '';
        if (notes === undefined) {
          const current = await db
            .select({ notes: dayOfRunSheet.notes })
            .from(dayOfRunSheet)
            .where(eq(dayOfRunSheet.id, id))
            .limit(1);
          currentNotes = current[0]?.notes || '';
        }
        const cleanNotes = currentNotes.replace(/\[STATUS:[A-Z_]+\]/g, '').trim();
        updateData.notes = `[STATUS:${status.toUpperCase()}] ${cleanNotes}`.trim();
      } else if (notes !== undefined) {
        updateData.notes = notes.trim();
      }

      const [updated] = await db
        .update(dayOfRunSheet)
        .set(updateData)
        .where(eq(dayOfRunSheet.id, id))
        .returning();

      if (!updated) {
        reply.status(404);
        return { success: false, message: 'Run sheet item not found.' };
      }

      return { success: true, message: 'Run sheet item updated', data: updated };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      fastify.log.error(err);
      reply.status(500);
      return { success: false, message: 'Failed to update run sheet item', error: msg };
    }
  });

  // DELETE /api/day-of/run-sheet/:id
  fastify.delete('/run-sheet/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    if (!UUID_REGEX.test(id)) {
      reply.status(400);
      return { success: false, message: 'Invalid run sheet UUID.' };
    }

    try {
      const [deleted] = await db
        .delete(dayOfRunSheet)
        .where(eq(dayOfRunSheet.id, id))
        .returning();

      if (!deleted) {
        reply.status(404);
        return { success: false, message: 'Run sheet item not found.' };
      }

      return { success: true, message: 'Run sheet item deleted', data: deleted };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      reply.status(500);
      return { success: false, message: 'Failed to delete run sheet item', error: msg };
    }
  });

  // ==========================================================================
  // SECTION 2: VENDOR ARRIVAL TELEMETRY
  // ==========================================================================

  // GET /api/day-of/vendor-checkins
  fastify.get('/vendor-checkins', async (request: FastifyRequest<{ Querystring: { weddingId?: string } }>, reply: FastifyReply) => {
    const { weddingId } = request.query;

    try {
      const targetWeddingId = await resolveWeddingId(weddingId);
      if (!targetWeddingId) {
        return { success: true, data: [] };
      }

      const rows = await db
        .select({
          id: dayOfVendorCheckins.id,
          weddingId: dayOfVendorCheckins.weddingId,
          weddingCode: weddings.code,
          vendorId: dayOfVendorCheckins.vendorId,
          vendor: vendors.businessName,
          category: vendors.category,
          scheduledArrivalTime: dayOfVendorCheckins.scheduledArrivalTime,
          actualArrivalTime: dayOfVendorCheckins.actualArrivalTime,
          status: dayOfVendorCheckins.status,
          delayMinutes: dayOfVendorCheckins.delayMinutes,
          staffVerifier: users.fullName,
          remarks: dayOfVendorCheckins.remarks,
        })
        .from(dayOfVendorCheckins)
        .innerJoin(weddings, eq(dayOfVendorCheckins.weddingId, weddings.id))
        .innerJoin(vendors, eq(dayOfVendorCheckins.vendorId, vendors.id))
        .leftJoin(users, eq(dayOfVendorCheckins.staffVerifierId, users.id))
        .where(eq(dayOfVendorCheckins.weddingId, targetWeddingId))
        .orderBy(asc(dayOfVendorCheckins.scheduledArrivalTime));

      const data = rows.map((r) => {
        const scheduledDate = new Date(r.scheduledArrivalTime);
        const scheduledTime = scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let actualTime = 'Pending Check-in';
        if (r.actualArrivalTime) {
          const actDate = new Date(r.actualArrivalTime);
          actualTime = actDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        const isArrived = r.status === 'ARRIVED' || r.status === 'ARRIVED_ON_TIME';
        const isLate = r.status === 'RUNNING_LATE' || (r.delayMinutes && r.delayMinutes > 15);

        return {
          id: r.id,
          weddingId: r.weddingId,
          weddingCode: r.weddingCode,
          vendorId: r.vendorId,
          vendor: r.vendor,
          category: r.category,
          scheduled: scheduledTime,
          scheduledArrivalTime: r.scheduledArrivalTime,
          actual: actualTime,
          actualArrivalTime: r.actualArrivalTime,
          status: isLate ? 'RUNNING_LATE' : isArrived ? 'ARRIVED_ON_TIME' : 'SCHEDULED',
          rawStatus: r.status,
          delay: r.delayMinutes || 0,
          delayMinutes: r.delayMinutes || 0,
          staffVerifier: r.staffVerifier || 'Field Coordinator',
          remarks: r.remarks,
        };
      });

      return {
        success: true,
        data,
        total: data.length,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      fastify.log.error(err);
      reply.status(500);
      return { success: false, message: 'Failed to fetch vendor check-ins', error: msg };
    }
  });

  // GET /api/day-of/vendors - List registered vendors for selection
  fastify.get('/vendors', async (_request, reply) => {
    try {
      const rows = await db
        .select({
          id: vendors.id,
          businessName: vendors.businessName,
          category: vendors.category,
          contactPerson: vendors.contactPerson,
          phone: vendors.phone,
        })
        .from(vendors)
        .orderBy(asc(vendors.businessName));

      return { success: true, data: rows };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      reply.status(500);
      return { success: false, message: 'Failed to fetch vendors', error: msg };
    }
  });

  // POST /api/day-of/vendor-checkins
  fastify.post('/vendor-checkins', async (request: FastifyRequest<{
    Body: {
      weddingId: string;
      vendorId: string;
      scheduledArrivalTime?: string;
      actualArrivalTime?: string;
      status?: string;
      delayMinutes?: number;
      remarks?: string;
    };
  }>, reply: FastifyReply) => {
    const { weddingId, vendorId, scheduledArrivalTime, actualArrivalTime, status = 'SCHEDULED', delayMinutes = 0, remarks = '' } = request.body || {};

    if (!weddingId || !vendorId) {
      reply.status(400);
      return { success: false, message: 'weddingId and vendorId are required.' };
    }

    try {
      const targetWeddingId = await resolveWeddingId(weddingId);
      if (!targetWeddingId) {
        reply.status(404);
        return { success: false, message: `Wedding '${weddingId}' not found.` };
      }

      // Resolve vendorId by UUID or name
      let targetVendorId = vendorId;
      if (!UUID_REGEX.test(vendorId)) {
        const found = await db
          .select({ id: vendors.id })
          .from(vendors)
          .where(ilike(sql`${vendors.businessName}`, `%${vendorId.trim()}%`))
          .limit(1);
        if (found.length) {
          targetVendorId = found[0].id;
        } else {
          const anyVendor = await db.select({ id: vendors.id }).from(vendors).limit(1);
          targetVendorId = anyVendor[0]?.id;
        }
      }

      // Resolve scheduled arrival date/time
      let scheduledDate = new Date();
      if (scheduledArrivalTime) {
        if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(scheduledArrivalTime.trim())) {
          const [h, m] = scheduledArrivalTime.trim().split(':').map(Number);
          scheduledDate.setHours(h, m, 0, 0);
        } else {
          const parsed = new Date(scheduledArrivalTime);
          if (!isNaN(parsed.getTime())) {
            scheduledDate = parsed;
          }
        }
      }

      const [created] = await db
        .insert(dayOfVendorCheckins)
        .values({
          weddingId: targetWeddingId,
          vendorId: targetVendorId,
          scheduledArrivalTime: scheduledDate,
          actualArrivalTime: actualArrivalTime ? new Date(actualArrivalTime) : null,
          status,
          delayMinutes,
          remarks: remarks.trim() || null,
        })
        .returning();

      return { success: true, message: 'Vendor check-in scheduled', data: created };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      fastify.log.error(err);
      reply.status(500);
      return { success: false, message: 'Failed to schedule check-in', error: msg };
    }
  });

  // PATCH /api/day-of/vendor-checkins/:id
  fastify.patch('/vendor-checkins/:id', async (request: FastifyRequest<{
    Params: { id: string };
    Body: {
      status?: string;
      actualArrivalTime?: string | Date;
      delayMinutes?: number;
      remarks?: string;
    };
  }>, reply: FastifyReply) => {
    const { id } = request.params;
    const { status, actualArrivalTime, delayMinutes, remarks } = request.body || {};

    if (!UUID_REGEX.test(id)) {
      reply.status(400);
      return { success: false, message: 'Invalid check-in UUID.' };
    }

    try {
      const updateData: Partial<typeof dayOfVendorCheckins.$inferInsert> = {};
      if (status !== undefined) updateData.status = status;
      if (delayMinutes !== undefined) updateData.delayMinutes = delayMinutes;
      if (remarks !== undefined) updateData.remarks = remarks;

      if (actualArrivalTime !== undefined) {
        updateData.actualArrivalTime = actualArrivalTime ? new Date(actualArrivalTime) : null;
      } else if (status === 'ARRIVED_ON_TIME' || status === 'ARRIVED') {
        updateData.actualArrivalTime = new Date();
      }

      const [updated] = await db
        .update(dayOfVendorCheckins)
        .set(updateData)
        .where(eq(dayOfVendorCheckins.id, id))
        .returning();

      if (!updated) {
        reply.status(404);
        return { success: false, message: 'Check-in record not found.' };
      }

      return { success: true, message: 'Vendor check-in telemetry updated', data: updated };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      fastify.log.error(err);
      reply.status(500);
      return { success: false, message: 'Failed to update check-in', error: msg };
    }
  });

  // ==========================================================================
  // SECTION 3: DAY-OF OPERATIONAL INCIDENTS
  // ==========================================================================

  // GET /api/day-of/incidents
  fastify.get('/incidents', async (request: FastifyRequest<{ Querystring: { weddingId?: string } }>, reply: FastifyReply) => {
    const { weddingId } = request.query;

    try {
      const targetWeddingId = await resolveWeddingId(weddingId);
      if (!targetWeddingId) {
        return { success: true, data: [] };
      }

      const rows = await db
        .select({
          id: dayOfIncidents.id,
          weddingId: dayOfIncidents.weddingId,
          weddingCode: weddings.code,
          title: dayOfIncidents.title,
          severity: dayOfIncidents.severity,
          status: dayOfIncidents.status,
          assignedToId: dayOfIncidents.assignedTo,
          assignedTo: users.fullName,
          assignedRole: users.role,
          resolutionNotes: dayOfIncidents.resolutionNotes,
          createdAt: dayOfIncidents.createdAt,
          resolvedAt: dayOfIncidents.resolvedAt,
        })
        .from(dayOfIncidents)
        .innerJoin(weddings, eq(dayOfIncidents.weddingId, weddings.id))
        .leftJoin(users, eq(dayOfIncidents.assignedTo, users.id))
        .where(eq(dayOfIncidents.weddingId, targetWeddingId))
        .orderBy(desc(dayOfIncidents.createdAt));

      const data = rows.map((r) => {
        const timeFormatted = r.createdAt
          ? new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'Live';

        return {
          id: r.id,
          weddingId: r.weddingId,
          weddingCode: r.weddingCode,
          title: r.title,
          severity: r.severity || 'HIGH',
          status: r.status || 'INVESTIGATING',
          assignedTo: r.assignedTo || 'Karan Verma',
          assignedRole: r.assignedRole,
          resolutionNotes: r.resolutionNotes,
          time: timeFormatted,
          createdAt: r.createdAt,
          resolvedAt: r.resolvedAt,
        };
      });

      return {
        success: true,
        data,
        total: data.length,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      fastify.log.error(err);
      reply.status(500);
      return { success: false, message: 'Failed to fetch incidents', error: msg };
    }
  });

  // POST /api/day-of/incidents
  fastify.post('/incidents', async (request: FastifyRequest<{
    Body: {
      weddingId: string;
      title: string;
      severity?: 'HIGH' | 'MEDIUM' | 'LOW';
      assignedTo?: string;
      ownerName?: string;
      resolutionNotes?: string;
    };
  }>, reply: FastifyReply) => {
    const { weddingId, title, severity = 'HIGH', assignedTo, ownerName, resolutionNotes = '' } = request.body || {};

    if (!weddingId || !title?.trim()) {
      reply.status(400);
      return { success: false, message: 'weddingId and incident title are required.' };
    }

    try {
      const targetWeddingId = await resolveWeddingId(weddingId);
      if (!targetWeddingId) {
        reply.status(404);
        return { success: false, message: `Wedding '${weddingId}' not found.` };
      }

      // Resolve user UUID
      let targetAssignedTo = assignedTo && UUID_REGEX.test(assignedTo) ? assignedTo : null;
      if (!targetAssignedTo && ownerName?.trim()) {
        const foundUser = await db
          .select({ id: users.id })
          .from(users)
          .where(ilike(sql`${users.fullName}`, `%${ownerName.trim()}%`))
          .limit(1);
        if (foundUser.length) {
          targetAssignedTo = foundUser[0].id;
        }
      }

      const [created] = await db
        .insert(dayOfIncidents)
        .values({
          weddingId: targetWeddingId,
          title: title.trim(),
          severity,
          status: 'INVESTIGATING',
          assignedTo: targetAssignedTo,
          resolutionNotes: resolutionNotes.trim() || null,
        })
        .returning();

      return { success: true, message: 'Operational incident logged', data: created };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      fastify.log.error(err);
      reply.status(500);
      return { success: false, message: 'Failed to log incident', error: msg };
    }
  });

  // PATCH /api/day-of/incidents/:id
  fastify.patch('/incidents/:id', async (request: FastifyRequest<{
    Params: { id: string };
    Body: {
      status?: 'INVESTIGATING' | 'RESOLVED';
      resolutionNotes?: string;
      severity?: 'HIGH' | 'MEDIUM' | 'LOW';
    };
  }>, reply: FastifyReply) => {
    const { id } = request.params;
    const { status, resolutionNotes, severity } = request.body || {};

    if (!UUID_REGEX.test(id)) {
      reply.status(400);
      return { success: false, message: 'Invalid incident UUID.' };
    }

    try {
      const updateData: Partial<typeof dayOfIncidents.$inferInsert> = {};
      if (status !== undefined) {
        updateData.status = status;
        if (status === 'RESOLVED') {
          updateData.resolvedAt = new Date();
        } else {
          updateData.resolvedAt = null;
        }
      }
      if (resolutionNotes !== undefined) updateData.resolutionNotes = resolutionNotes.trim();
      if (severity !== undefined) updateData.severity = severity;

      const [updated] = await db
        .update(dayOfIncidents)
        .set(updateData)
        .where(eq(dayOfIncidents.id, id))
        .returning();

      if (!updated) {
        reply.status(404);
        return { success: false, message: 'Incident not found.' };
      }

      return { success: true, message: 'Incident status updated', data: updated };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      fastify.log.error(err);
      reply.status(500);
      return { success: false, message: 'Failed to update incident', error: msg };
    }
  });

  // DELETE /api/day-of/incidents/:id
  fastify.delete('/incidents/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    if (!UUID_REGEX.test(id)) {
      reply.status(400);
      return { success: false, message: 'Invalid incident UUID.' };
    }

    try {
      const [deleted] = await db
        .delete(dayOfIncidents)
        .where(eq(dayOfIncidents.id, id))
        .returning();

      if (!deleted) {
        reply.status(404);
        return { success: false, message: 'Incident not found.' };
      }

      return { success: true, message: 'Incident deleted', data: deleted };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      reply.status(500);
      return { success: false, message: 'Failed to delete incident', error: msg };
    }
  });
}
