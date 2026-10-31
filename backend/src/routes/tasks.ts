import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db';
import { weddingTasks, weddings, users } from '../db/schema';
import { eq, desc, asc, ilike, or, and, sql, type SQL } from 'drizzle-orm';

interface TaskFilterQuery {
  weddingId?: string;
  stage?: string;
  category?: string;
  owner?: string;
  isMilestone?: string;
  search?: string;
}

interface CreateTaskBody {
  weddingId: string;
  title: string;
  category?: string;
  assignedTo?: string;
  ownerName?: string;
  dueDate?: string;
  daysBefore?: string;
  stage?: string;
  isMilestone?: boolean;
  notes?: string;
}

interface UpdateTaskBody {
  title?: string;
  category?: string;
  assignedTo?: string;
  ownerName?: string;
  dueDate?: string;
  stage?: 'TO_PLAN' | 'IN_PROGRESS' | 'DONE';
  isMilestone?: boolean;
  notes?: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolves a wedding UUID purely from the database by ID or code,
 * or defaults to the flagship active wedding if 'ALL' is selected.
 */
async function resolveWeddingId(weddingIdOrCode?: string): Promise<string | null> {
  if (!weddingIdOrCode || weddingIdOrCode === 'ALL') {
    const defaultWedding = await db
      .select({ id: weddings.id })
      .from(weddings)
      .orderBy(asc(weddings.startDate))
      .limit(1);

    return defaultWedding.length ? defaultWedding[0].id : null;
  }

  const trimmed = weddingIdOrCode.trim();

  // If a valid UUID, lookup by primary key
  if (UUID_REGEX.test(trimmed)) {
    const foundById = await db
      .select({ id: weddings.id })
      .from(weddings)
      .where(eq(weddings.id, trimmed))
      .limit(1);

    return foundById.length ? foundById[0].id : null;
  }

  // Lookup by unique wedding project code (e.g. 'RW-2025-010')
  const foundByCode = await db
    .select({ id: weddings.id })
    .from(weddings)
    .where(eq(weddings.code, trimmed))
    .limit(1);

  return foundByCode.length ? foundByCode[0].id : null;
}

export async function tasksRoutes(fastify: FastifyInstance) {
  // 1. GET /api/tasks - List all checklist tasks with filtering and stats strictly from database
  fastify.get('/', async (request: FastifyRequest<{ Querystring: TaskFilterQuery }>, reply: FastifyReply) => {
    const { weddingId, stage, category, owner, isMilestone, search } = request.query;

    try {
      const conditions: SQL[] = [];

      // Filter by weddingId or wedding code
      if (weddingId && weddingId !== 'ALL') {
        if (UUID_REGEX.test(weddingId)) {
          conditions.push(eq(weddingTasks.weddingId, weddingId));
        } else {
          conditions.push(eq(weddings.code, weddingId));
        }
      }

      // Filter by stage
      if (stage && stage !== 'ALL') {
        conditions.push(eq(weddingTasks.stage, stage));
      }

      // Filter by category
      if (category && category !== 'ALL') {
        conditions.push(eq(weddingTasks.category, category.toUpperCase()));
      }

      // Filter by owner / assignee
      if (owner && owner !== 'ALL') {
        conditions.push(ilike(sql`${users.fullName}`, `%${owner.trim()}%`));
      }

      // Filter by milestone status
      if (isMilestone && isMilestone !== 'ALL') {
        conditions.push(eq(weddingTasks.isMilestone, isMilestone === 'true'));
      }

      // Search across task title, notes, or assigned user
      if (search && search.trim()) {
        const term = `%${search.trim()}%`;
        conditions.push(
          or(
            ilike(sql`${weddingTasks.title}`, term),
            ilike(sql`${weddingTasks.notes}`, term),
            ilike(sql`${users.fullName}`, term)
          )!
        );
      }

      const rows = await db
        .select({
          id: weddingTasks.id,
          weddingId: weddingTasks.weddingId,
          weddingCode: weddings.code,
          weddingTheme: weddings.theme,
          destinationCity: weddings.destinationCity,
          title: weddingTasks.title,
          category: weddingTasks.category,
          assignedTo: weddingTasks.assignedTo,
          owner: users.fullName,
          ownerRole: users.role,
          dueDate: weddingTasks.dueDate,
          stage: weddingTasks.stage,
          isMilestone: weddingTasks.isMilestone,
          completedAt: weddingTasks.completedAt,
          notes: weddingTasks.notes,
        })
        .from(weddingTasks)
        .innerJoin(weddings, eq(weddingTasks.weddingId, weddings.id))
        .leftJoin(users, eq(weddingTasks.assignedTo, users.id))
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(asc(weddingTasks.dueDate), desc(weddingTasks.id));

      // Calculate stats based on scoped wedding (or all)
      const statsConditions: SQL[] = [];
      if (weddingId && weddingId !== 'ALL') {
        if (UUID_REGEX.test(weddingId)) {
          statsConditions.push(eq(weddingTasks.weddingId, weddingId));
        } else {
          statsConditions.push(eq(weddings.code, weddingId));
        }
      }

      const statsRows = await db
        .select({
          stage: weddingTasks.stage,
          count: sql<number>`count(*)::int`,
        })
        .from(weddingTasks)
        .innerJoin(weddings, eq(weddingTasks.weddingId, weddings.id))
        .where(statsConditions.length ? and(...statsConditions) : undefined)
        .groupBy(weddingTasks.stage);

      let total = 0;
      let toPlan = 0;
      let inProgress = 0;
      let done = 0;

      for (const row of statsRows) {
        const c = row.count || 0;
        total += c;
        if (row.stage === 'TO_PLAN') toPlan = c;
        else if (row.stage === 'IN_PROGRESS') inProgress = c;
        else if (row.stage === 'DONE') done = c;
      }

      const stats = { total, toPlan, inProgress, done };

      // Map rows to friendly UI schema
      const now = new Date();
      const tasks = rows.map((r, index) => {
        let daysBefore = 'Today';
        if (r.dueDate) {
          const due = new Date(r.dueDate);
          const diffTime = due.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays > 0) {
            daysBefore = `-${diffDays} Days`;
          } else if (diffDays === 0) {
            daysBefore = 'Today';
          } else {
            daysBefore = `+${Math.abs(diffDays)} Days`;
          }
        }

        return {
          id: r.id,
          code: `TSK-${String(index + 1).padStart(2, '0')}`,
          weddingId: r.weddingId,
          weddingCode: r.weddingCode,
          weddingTheme: r.weddingTheme,
          destinationCity: r.destinationCity,
          title: r.title,
          category: r.category,
          assignedTo: r.assignedTo,
          owner: r.owner || 'Unassigned',
          ownerRole: r.ownerRole || null,
          dueDate: r.dueDate,
          daysBefore,
          stage: r.stage,
          isMilestone: r.isMilestone,
          completedAt: r.completedAt,
          notes: r.notes,
        };
      });

      return {
        success: true,
        data: tasks,
        stats,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      fastify.log.error(err);
      reply.status(500);
      return {
        success: false,
        message: 'Failed to fetch checklist tasks',
        error: message,
      };
    }
  });

  // 2. GET /api/tasks/:id - Single task by UUID
  fastify.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    if (!UUID_REGEX.test(id)) {
      reply.status(400);
      return { success: false, message: 'Invalid task UUID format.' };
    }

    try {
      const rows = await db
        .select({
          id: weddingTasks.id,
          weddingId: weddingTasks.weddingId,
          weddingCode: weddings.code,
          weddingTheme: weddings.theme,
          title: weddingTasks.title,
          category: weddingTasks.category,
          assignedTo: weddingTasks.assignedTo,
          owner: users.fullName,
          ownerRole: users.role,
          dueDate: weddingTasks.dueDate,
          stage: weddingTasks.stage,
          isMilestone: weddingTasks.isMilestone,
          completedAt: weddingTasks.completedAt,
          notes: weddingTasks.notes,
        })
        .from(weddingTasks)
        .innerJoin(weddings, eq(weddingTasks.weddingId, weddings.id))
        .leftJoin(users, eq(weddingTasks.assignedTo, users.id))
        .where(eq(weddingTasks.id, id))
        .limit(1);

      if (!rows.length) {
        reply.status(404);
        return { success: false, message: 'Task not found.' };
      }

      return { success: true, data: rows[0] };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      reply.status(500);
      return { success: false, message: 'Failed to fetch task', error: message };
    }
  });

  // 3. POST /api/tasks - Create a new checklist task
  fastify.post('/', async (request: FastifyRequest<{ Body: CreateTaskBody }>, reply: FastifyReply) => {
    const {
      weddingId,
      title,
      category = 'VENUE',
      assignedTo,
      ownerName,
      dueDate,
      daysBefore,
      stage = 'TO_PLAN',
      isMilestone = false,
      notes = '',
    } = request.body || {};

    if (!weddingId || !title?.trim()) {
      reply.status(400);
      return {
        success: false,
        message: 'weddingId and title are required.',
      };
    }

    try {
      // Resolve wedding UUID strictly against PostgreSQL database
      const targetWeddingId = await resolveWeddingId(weddingId);

      if (!targetWeddingId) {
        reply.status(404);
        return {
          success: false,
          message: `Wedding with code '${weddingId}' not found.`,
        };
      }

      // Resolve user UUID if ownerName was provided without assignedTo
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

      // Compute dueDate from daysBefore if dueDate was not explicitly supplied
      let targetDueDate: string | null = dueDate || null;
      if (!targetDueDate && daysBefore) {
        const match = daysBefore.match(/(\d+)/);
        const days = match ? parseInt(match[1], 10) : 15;
        const d = new Date();
        d.setDate(d.getDate() + days);
        targetDueDate = d.toISOString().split('T')[0];
      }

      const [created] = await db
        .insert(weddingTasks)
        .values({
          weddingId: targetWeddingId,
          title: title.trim(),
          category: category.toUpperCase(),
          assignedTo: targetAssignedTo,
          dueDate: targetDueDate,
          stage: stage || 'TO_PLAN',
          isMilestone,
          notes: notes?.trim() || null,
        })
        .returning();

      return {
        success: true,
        message: 'Task created successfully',
        data: created,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      fastify.log.error(err);
      reply.status(500);
      return {
        success: false,
        message: 'Failed to create task',
        error: message,
      };
    }
  });

  // 4. PATCH /api/tasks/:id/toggle - Toggle / cycle status (TO_PLAN -> IN_PROGRESS -> DONE -> TO_PLAN)
  fastify.patch('/:id/toggle', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    if (!UUID_REGEX.test(id)) {
      reply.status(400);
      return { success: false, message: 'Invalid task UUID format.' };
    }

    try {
      const existing = await db
        .select({ id: weddingTasks.id, stage: weddingTasks.stage })
        .from(weddingTasks)
        .where(eq(weddingTasks.id, id))
        .limit(1);

      if (!existing.length) {
        reply.status(404);
        return { success: false, message: 'Task not found.' };
      }

      const current = existing[0].stage;
      let nextStage = 'TO_PLAN';
      let completedAt: Date | null = null;

      if (current === 'TO_PLAN') {
        nextStage = 'IN_PROGRESS';
      } else if (current === 'IN_PROGRESS') {
        nextStage = 'DONE';
        completedAt = new Date();
      } else {
        nextStage = 'TO_PLAN';
      }

      const [updated] = await db
        .update(weddingTasks)
        .set({
          stage: nextStage,
          completedAt,
        })
        .where(eq(weddingTasks.id, id))
        .returning();

      return {
        success: true,
        message: `Task stage moved from ${current} to ${nextStage}`,
        data: updated,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      fastify.log.error(err);
      reply.status(500);
      return {
        success: false,
        message: 'Failed to toggle task stage',
        error: message,
      };
    }
  });

  // 5. PATCH /api/tasks/:id - Update task details
  fastify.patch('/:id', async (request: FastifyRequest<{ Params: { id: string }; Body: UpdateTaskBody }>, reply: FastifyReply) => {
    const { id } = request.params;
    const { title, category, assignedTo, ownerName, dueDate, stage, isMilestone, notes } = request.body || {};

    if (!UUID_REGEX.test(id)) {
      reply.status(400);
      return { success: false, message: 'Invalid task UUID format.' };
    }

    try {
      const updateData: Partial<typeof weddingTasks.$inferInsert> = {};

      if (title !== undefined) updateData.title = title.trim();
      if (category !== undefined) updateData.category = category.toUpperCase();
      if (dueDate !== undefined) updateData.dueDate = dueDate || null;
      if (isMilestone !== undefined) updateData.isMilestone = isMilestone;
      if (notes !== undefined) updateData.notes = notes;

      if (stage !== undefined) {
        updateData.stage = stage;
        if (stage === 'DONE') {
          updateData.completedAt = new Date();
        } else {
          updateData.completedAt = null;
        }
      }

      if (assignedTo !== undefined) {
        updateData.assignedTo = assignedTo && UUID_REGEX.test(assignedTo) ? assignedTo : null;
      } else if (ownerName?.trim()) {
        const foundUser = await db
          .select({ id: users.id })
          .from(users)
          .where(ilike(sql`${users.fullName}`, `%${ownerName.trim()}%`))
          .limit(1);
        if (foundUser.length) {
          updateData.assignedTo = foundUser[0].id;
        }
      }

      const [updated] = await db
        .update(weddingTasks)
        .set(updateData)
        .where(eq(weddingTasks.id, id))
        .returning();

      if (!updated) {
        reply.status(404);
        return { success: false, message: 'Task not found.' };
      }

      return {
        success: true,
        message: 'Task updated successfully',
        data: updated,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      fastify.log.error(err);
      reply.status(500);
      return {
        success: false,
        message: 'Failed to update task',
        error: message,
      };
    }
  });

  // 6. DELETE /api/tasks/:id - Delete a task
  fastify.delete('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;

    if (!UUID_REGEX.test(id)) {
      reply.status(400);
      return { success: false, message: 'Invalid task UUID format.' };
    }

    try {
      const [deleted] = await db
        .delete(weddingTasks)
        .where(eq(weddingTasks.id, id))
        .returning();

      if (!deleted) {
        reply.status(404);
        return { success: false, message: 'Task not found.' };
      }

      return {
        success: true,
        message: 'Task deleted successfully',
        data: deleted,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      fastify.log.error(err);
      reply.status(500);
      return {
        success: false,
        message: 'Failed to delete task',
        error: message,
      };
    }
  });
}
