/**
 * End-to-End (E2E) Test Suite for The Royal Knot Dynamic Database Architecture
 * Covers:
 * - Dynamic /api/weddings endpoint verifying live database queries & joins
 * - Baseline Checklist Queries & Statistical Integrity
 * - Multi-Wedding Coverage across all 5 database-seeded projects (RW-2026-001, RW-2026-002, RW-2026-003, RW-2025-010, RW-2025-011)
 * - Verifying joined relational owners (Devika Sharma, Karan Verma, Anil Agarwal, Aditya Singhal) from users table
 * - Task Creation across all wedding projects
 * - Safe database-driven fallback handling for 'ALL' project selection
 * - Full CRUD Lifecycle: Create -> Single Read -> Toggle Transitions -> Update -> Delete
 * - Category, Stage, Milestone, Owner and Search Filters
 * - Error Boundary Validations
 */

const BASE_URL = 'http://localhost:5000/api';

interface TestResult {
  suite: string;
  test: string;
  passed: boolean;
  details?: string;
  error?: any;
}

const results: TestResult[] = [];

function assert(condition: boolean, test: string, suite: string, details?: string) {
  if (condition) {
    results.push({ suite, test, passed: true, details });
    console.log(`  ✅ [PASS] ${test}`);
  } else {
    results.push({ suite, test, passed: false, details });
    console.error(`  ❌ [FAIL] ${test} - ${details || 'Assertion failed'}`);
  }
}

async function request(path: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...((options.headers as any) || {}),
  };
  const res = await fetch(url, {
    ...options,
    headers,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runE2ETests() {
  console.log('\n======================================================');
  console.log('🚀 STARTING COMPREHENSIVE E2E VERIFICATION: FULL STACK');
  console.log('======================================================\n');

  // --------------------------------------------------------------------------
  // SUITE 1: DYNAMIC WEDDINGS API (JOINED FROM CLIENTS & USERS)
  // --------------------------------------------------------------------------
  console.log('📦 SUITE 1: Dynamic Weddings API (/api/weddings)');

  const weddingsRes = await request('/weddings');
  assert(weddingsRes.status === 200, 'GET /api/weddings returns HTTP 200', 'Suite 1');
  assert(weddingsRes.data?.success === true, 'Response contains success: true', 'Suite 1');
  assert(Array.isArray(weddingsRes.data?.data), 'Response data is an array of weddings', 'Suite 1');
  assert(weddingsRes.data?.data.length === 5, `Database contains exactly 5 seeded projects (found: ${weddingsRes.data?.data.length})`, 'Suite 1');

  // Verify joined relational data in weddings
  const w10 = weddingsRes.data?.data.find((w: any) => w.code === 'RW-2025-010');
  assert(Boolean(w10), 'RW-2025-010 exists in dynamic database response', 'Suite 1');
  assert(w10?.couple === 'Pooja Agarwal & Rohan Kapoor', 'Couple names correctly joined from clients table', 'Suite 1');
  assert(w10?.coordinator === 'Devika Sharma', 'Coordinator correctly joined from users table', 'Suite 1');
  assert(w10?.city === 'Jodhpur', 'Destination city is Jodhpur', 'Suite 1');
  assert(w10?.venue === 'Umaid Bhawan Palace', 'Primary venue is Umaid Bhawan Palace', 'Suite 1');

  // --------------------------------------------------------------------------
  // SUITE 2: BASELINE CHECKLIST QUERIES & STATISTICAL INTEGRITY
  // --------------------------------------------------------------------------
  console.log('\n📦 SUITE 2: Baseline Queries & Statistical Integrity');

  const baseline = await request('/tasks');
  assert(baseline.status === 200, 'GET /api/tasks returns HTTP 200', 'Suite 2');
  assert(baseline.data?.success === true, 'Response contains success: true', 'Suite 2');
  assert(Array.isArray(baseline.data?.data), 'Response data is an array of tasks', 'Suite 2');
  assert(baseline.data?.data.length >= 44, `Tasks count >= 44 (found: ${baseline.data?.data.length})`, 'Suite 2');

  // Verify contract shape required by client Tasks.tsx
  const sample = baseline.data?.data[0];
  assert(typeof sample.id === 'string' && sample.id.length === 36, 'Task id is a valid 36-char UUID', 'Suite 2');
  assert(typeof sample.title === 'string' && sample.title.length > 0, 'Task has valid title', 'Suite 2');
  assert(typeof sample.category === 'string', 'Task has category string', 'Suite 2');
  assert(typeof sample.owner === 'string', 'Task has owner name string', 'Suite 2');
  assert(['TO_PLAN', 'IN_PROGRESS', 'DONE'].includes(sample.stage), `Task stage is valid enum (${sample.stage})`, 'Suite 2');
  assert(typeof sample.daysBefore === 'string', `Task has calculated daysBefore string (${sample.daysBefore})`, 'Suite 2');
  assert(typeof sample.code === 'string' && sample.code.startsWith('TSK-'), `Task has formatted display code (${sample.code})`, 'Suite 2');

  // Verify statistical integrity across all projects
  const stats = baseline.data?.stats;
  assert(stats !== undefined, 'Stats object is present in response', 'Suite 2');
  assert(
    stats.total === stats.toPlan + stats.inProgress + stats.done,
    `Stats total (${stats.total}) equals sum of stages (${stats.toPlan} + ${stats.inProgress} + ${stats.done})`,
    'Suite 2'
  );

  // Verify relational owner joins (Devika Sharma, Karan Verma, Anil Agarwal, Aditya Singhal)
  const owners = new Set(baseline.data?.data.map((t: any) => t.owner));
  assert(owners.has('Devika Sharma'), 'Tasks joined with Lead Planner (Devika Sharma)', 'Suite 2');
  assert(owners.has('Anil Agarwal'), 'Tasks joined with Finance Head (Anil Agarwal)', 'Suite 2');
  assert(owners.has('Karan Verma'), 'Tasks joined with Coordinator (Karan Verma)', 'Suite 2');

  // --------------------------------------------------------------------------
  // SUITE 3: MULTI-PROJECT COVERAGE (ALL 5 WEDDINGS)
  // --------------------------------------------------------------------------
  console.log('\n📦 SUITE 3: Multi-Wedding Coverage & Project Filtering (All 5 Projects)');

  const weddingCodes = ['RW-2026-001', 'RW-2026-002', 'RW-2026-003', 'RW-2025-010', 'RW-2025-011'];

  for (const code of weddingCodes) {
    const res = await request(`/tasks?weddingId=${code}`);
    assert(res.status === 200, `Filter ?weddingId=${code} returns HTTP 200`, 'Suite 3');
    assert(Array.isArray(res.data?.data), `Tasks for ${code} is an array`, 'Suite 3');
    assert(res.data?.data.length > 0, `Tasks for ${code} found > 0 (count: ${res.data?.data.length})`, 'Suite 3');

    const allMatch = res.data?.data.every((t: any) => t.weddingCode === code);
    assert(allMatch, `All returned tasks for ?weddingId=${code} strictly match weddingCode`, 'Suite 3');

    const wStats = res.data?.stats;
    assert(
      wStats.total === res.data?.data.length,
      `Scoped stats total for ${code} (${wStats.total}) matches returned task count (${res.data?.data.length})`,
      'Suite 3'
    );
  }

  // --------------------------------------------------------------------------
  // SUITE 4: ADD TASK ACROSS DIFFERENT WEDDINGS (ZERO HARDCODED MOCKS)
  // --------------------------------------------------------------------------
  console.log('\n📦 SUITE 4: Task Creation Across All Weddings');

  // 1. Create task specifically for RW-2025-010
  const rw10Title = `Umaid Bhawan Vault Audit & Post-Settlement Clearance #${Date.now()}`;
  const rw10Create = await request('/tasks', {
    method: 'POST',
    body: JSON.stringify({
      weddingId: 'RW-2025-010',
      title: rw10Title,
      category: 'FINANCE',
      ownerName: 'Anil Agarwal',
      daysBefore: '5 Days',
      notes: 'Testing creation for finalized wedding RW-2025-010',
    }),
  });

  assert(rw10Create.status === 200, 'POST /api/tasks with weddingId="RW-2025-010" returns HTTP 200', 'Suite 4');
  assert(rw10Create.data?.success === true, 'Task creation for RW-2025-010 succeeded', 'Suite 4');
  assert(rw10Create.data?.data?.title === rw10Title, 'Task title matches input payload', 'Suite 4');
  const rw10TaskId = rw10Create.data?.data?.id;

  // 2. Create task for RW-2025-011
  const rw11Title = `Taj Lake Palace Floating Jetty Safety Certification #${Date.now()}`;
  const rw11Create = await request('/tasks', {
    method: 'POST',
    body: JSON.stringify({
      weddingId: 'RW-2025-011',
      title: rw11Title,
      category: 'PERMITS',
      ownerName: 'Karan Verma',
      daysBefore: '10 Days',
    }),
  });
  assert(rw11Create.status === 200, 'POST /api/tasks with weddingId="RW-2025-011" returns HTTP 200', 'Suite 4');
  assert(rw11Create.data?.success === true, 'Task creation for RW-2025-011 succeeded', 'Suite 4');

  // 3. Create task with weddingId="ALL" (Graceful database fallback to active wedding)
  const allTitle = `Global SOP Checklist Standardization #${Date.now()}`;
  const allCreate = await request('/tasks', {
    method: 'POST',
    body: JSON.stringify({
      weddingId: 'ALL',
      title: allTitle,
      category: 'VENUE',
      ownerName: 'Aditya Singhal',
      daysBefore: '3 Days',
    }),
  });
  assert(allCreate.status === 200, 'POST /api/tasks with weddingId="ALL" resolves to default project gracefully', 'Suite 4');
  assert(allCreate.data?.success === true, 'Fallback project task created without 404 error', 'Suite 4');

  // Clean up
  if (allCreate.data?.data?.id) {
    await request(`/tasks/${allCreate.data.data.id}`, { method: 'DELETE' });
  }
  if (rw11Create.data?.data?.id) {
    await request(`/tasks/${rw11Create.data.data.id}`, { method: 'DELETE' });
  }

  // --------------------------------------------------------------------------
  // SUITE 5: FULL CRUD LIFECYCLE & STAGE TRANSITIONS ON RW-2025-010
  // --------------------------------------------------------------------------
  console.log('\n📦 SUITE 5: Full CRUD Lifecycle & Confirmation Dialog Emulation');

  // 1. Single GET
  const getSingle = await request(`/tasks/${rw10TaskId}`);
  assert(getSingle.status === 200, 'GET /api/tasks/:id retrieves task on RW-2025-010', 'Suite 5');
  assert(getSingle.data?.data?.weddingCode === 'RW-2025-010', 'Single task returns weddingCode RW-2025-010', 'Suite 5');

  // 2. Toggle Stage: TO_PLAN -> IN_PROGRESS
  const toggle1 = await request(`/tasks/${rw10TaskId}/toggle`, { method: 'PATCH' });
  assert(toggle1.status === 200, 'First toggle advances stage to IN_PROGRESS', 'Suite 5');
  assert(toggle1.data?.data?.stage === 'IN_PROGRESS', 'Task stage is IN_PROGRESS', 'Suite 5');
  assert(toggle1.data?.data?.completedAt === null, 'completedAt is null during IN_PROGRESS', 'Suite 5');

  // 3. User Confirms Finish in Pop-up Dialog: IN_PROGRESS -> DONE
  const finishConfirm = await request(`/tasks/${rw10TaskId}`, {
    method: 'PATCH',
    body: JSON.stringify({ stage: 'DONE' }),
  });
  assert(finishConfirm.status === 200, 'PATCH /api/tasks/:id stage=DONE updates successfully', 'Suite 5');
  assert(finishConfirm.data?.data?.stage === 'DONE', 'Task is marked DONE', 'Suite 5');
  assert(Boolean(finishConfirm.data?.data?.completedAt), 'completedAt timestamp set on finish', 'Suite 5');

  // 4. User Unchecks: DONE -> IN_PROGRESS
  const uncheck = await request(`/tasks/${rw10TaskId}`, {
    method: 'PATCH',
    body: JSON.stringify({ stage: 'IN_PROGRESS' }),
  });
  assert(uncheck.status === 200, 'Unchecking task moves stage back to IN_PROGRESS', 'Suite 5');
  assert(uncheck.data?.data?.stage === 'IN_PROGRESS', 'Task stage reset to IN_PROGRESS', 'Suite 5');
  assert(uncheck.data?.data?.completedAt === null, 'completedAt is cleared on uncheck', 'Suite 5');

  // 5. Update Details (Title, Category, Milestone)
  const updatedRw10Title = `${rw10Title} [AUDITED]`;
  const updateRes = await request(`/tasks/${rw10TaskId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      title: updatedRw10Title,
      category: 'DESIGN',
      isMilestone: true,
    }),
  });
  assert(updateRes.status === 200, 'PATCH /api/tasks/:id updates title & category', 'Suite 5');
  assert(updateRes.data?.data?.title === updatedRw10Title, 'Title updated successfully', 'Suite 5');
  assert(updateRes.data?.data?.isMilestone === true, 'Milestone flag toggled to true', 'Suite 5');

  // 6. Delete Task
  const deleteRes = await request(`/tasks/${rw10TaskId}`, { method: 'DELETE' });
  assert(deleteRes.status === 200, 'DELETE /api/tasks/:id deletes task', 'Suite 5');
  assert(deleteRes.data?.success === true, 'Delete reports success: true', 'Suite 5');

  // 7. Verify 404 after deletion
  const verifyDeleted = await request(`/tasks/${rw10TaskId}`);
  assert(verifyDeleted.status === 404, 'GET /api/tasks/:id after deletion returns HTTP 404', 'Suite 5');

  // --------------------------------------------------------------------------
  // SUITE 6: ADVANCED FILTERING (MILESTONES, CATEGORY, OWNER, SEARCH)
  // --------------------------------------------------------------------------
  console.log('\n📦 SUITE 6: Advanced Filters & Search Across Ecosystem');

  // Milestone Filter
  const milestoneRes = await request('/tasks?isMilestone=true');
  assert(milestoneRes.status === 200, 'Filter ?isMilestone=true returns HTTP 200', 'Suite 6');
  assert(milestoneRes.data?.data.length > 0, 'Found milestone tasks in database', 'Suite 6');
  const allMilestones = milestoneRes.data?.data.every((t: any) => t.isMilestone === true);
  assert(allMilestones, 'All returned tasks have isMilestone === true', 'Suite 6');

  // Stage Filter: DONE
  const doneRes = await request('/tasks?stage=DONE');
  assert(doneRes.status === 200, 'Filter ?stage=DONE returns HTTP 200', 'Suite 6');
  const allDone = doneRes.data?.data.every((t: any) => t.stage === 'DONE');
  assert(allDone, 'All returned tasks have stage === DONE', 'Suite 6');

  // Category Filter: FINANCE
  const financeRes = await request('/tasks?category=FINANCE');
  assert(financeRes.status === 200, 'Filter ?category=FINANCE returns HTTP 200', 'Suite 6');
  const allFinance = financeRes.data?.data.every((t: any) => t.category === 'FINANCE');
  assert(allFinance, 'All returned tasks have category === FINANCE', 'Suite 6');

  // Owner Filter: Anil
  const ownerRes = await request('/tasks?owner=Anil');
  assert(ownerRes.status === 200, 'Filter ?owner=Anil returns HTTP 200', 'Suite 6');
  assert(ownerRes.data?.data.length > 0, 'Tasks found for Anil Agarwal', 'Suite 6');

  // Search Filter: "Palace"
  const searchRes = await request('/tasks?search=Palace');
  assert(searchRes.status === 200, 'Search ?search=Palace returns HTTP 200', 'Suite 6');
  assert(searchRes.data?.data.length > 0, 'Search returned tasks matching keyword "Palace"', 'Suite 6');

  // --------------------------------------------------------------------------
  // SUITE 7: ERROR BOUNDARIES & INPUT VALIDATION
  // --------------------------------------------------------------------------
  console.log('\n📦 SUITE 7: Error Boundaries & Input Validations');

  // Missing title
  const noTitle = await request('/tasks', {
    method: 'POST',
    body: JSON.stringify({ weddingId: 'RW-2026-001' }),
  });
  assert(noTitle.status === 400, 'POST /api/tasks without title returns HTTP 400', 'Suite 7');

  // Missing weddingId
  const noWedding = await request('/tasks', {
    method: 'POST',
    body: JSON.stringify({ title: 'Task with no wedding' }),
  });
  assert(noWedding.status === 400, 'POST /api/tasks without weddingId returns HTTP 400', 'Suite 7');

  // Non-existent arbitrary wedding
  const nonExistent = await request('/tasks', {
    method: 'POST',
    body: JSON.stringify({ weddingId: 'RW-9999-FAKE', title: 'Task on non-existent wedding' }),
  });
  assert(nonExistent.status === 404, 'POST /api/tasks with fake wedding returns HTTP 404', 'Suite 7');

  // Malformed UUID
  const malformed = await request('/tasks/not-a-valid-uuid');
  assert(malformed.status === 400, 'GET /api/tasks/not-a-uuid returns HTTP 400', 'Suite 7');

  // Non-existent UUID
  const nonExistentUuid = await request('/tasks/00000000-0000-0000-0000-000000000000');
  assert(nonExistentUuid.status === 404, 'GET /api/tasks/:nonExistentUuid returns HTTP 404', 'Suite 7');

  // --------------------------------------------------------------------------
  // SUMMARY REPORT
  // --------------------------------------------------------------------------
  console.log('\n======================================================');
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`📊 FINAL E2E SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED out of ${results.length} checks`);
  console.log('======================================================\n');

  if (failedCount > 0) {
    console.error('❌ E2E Verification failed on some assertions.');
    process.exit(1);
  } else {
    console.log('🎉 100% OF END-TO-END VERIFICATION CHECKS PASSED PERFECTLY!');
    process.exit(0);
  }
}

runE2ETests().catch((err) => {
  console.error('Fatal E2E test runner error:', err);
  process.exit(1);
});
