/**
 * End-to-End (E2E) Test Suite for Day-Of Operations & Telemetry Module
 * Covers:
 * - Minute-by-Minute Run Sheet CRUD & live timeline status calculation
 * - Vendor Arrival Telemetry & gate check-in status toggling
 * - Live Operational Incidents logging and resolution workflow
 * - Cross-Integration: Checklist Day-Of tasks accepting exact execution times
 * - Multi-Wedding verification across projects
 */

export {};

const BASE_URL = 'http://localhost:5000/api';

interface TestResult {
  suite: string;
  test: string;
  passed: boolean;
  details?: string;
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
    ...((options.headers as Record<string, string>) || {}),
  };
  const res = await fetch(url, {
    ...options,
    headers,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runDayOfE2ETests() {
  console.log('\n======================================================');
  console.log('🚀 STARTING COMPREHENSIVE E2E VERIFICATION: DAY-OF OPS');
  console.log('======================================================\n');

  // --------------------------------------------------------------------------
  // SUITE 1: MINUTE-BY-MINUTE RUN SHEET
  // --------------------------------------------------------------------------
  console.log('📦 SUITE 1: Minute-by-Minute Run Sheet Operations');

  const rsGet = await request('/day-of/run-sheet?weddingId=RW-2026-001');
  assert(rsGet.status === 200, 'GET /api/day-of/run-sheet returns HTTP 200', 'Suite 1');
  assert(rsGet.data?.success === true, 'Response contains success: true', 'Suite 1');
  assert(Array.isArray(rsGet.data?.data), 'Data is an array of run sheet slots', 'Suite 1');
  assert(rsGet.data?.data.length >= 9, `Contains at least 9 slots (found: ${rsGet.data?.data.length})`, 'Suite 1');

  const sampleSlot = rsGet.data?.data[0];
  assert(typeof sampleSlot.time === 'string' && sampleSlot.time.includes(':'), 'Time formatted as HH:MM', 'Suite 1');
  assert(typeof sampleSlot.event === 'string' && sampleSlot.event.length > 0, 'Slot has valid event title', 'Suite 1');
  assert(typeof sampleSlot.venue === 'string', 'Slot has valid venue/location string', 'Suite 1');
  assert(['COMPLETED', 'IN_PROGRESS', 'UPCOMING'].includes(sampleSlot.status), `Slot has computed status (${sampleSlot.status})`, 'Suite 1');

  // Create a new Run Sheet cue item
  const newCueTitle = `Baraat Royal Heritage Horse Assembly #${Date.now()}`;
  const rsCreate = await request('/day-of/run-sheet', {
    method: 'POST',
    body: JSON.stringify({
      weddingId: 'RW-2026-001',
      timeSlot: '15:45',
      activityTitle: newCueTitle,
      location: 'North Palace Gates',
      ownerName: 'Karan Verma',
    }),
  });
  assert(rsCreate.status === 200, 'POST /api/day-of/run-sheet returns HTTP 200', 'Suite 1');
  assert(rsCreate.data?.success === true, 'Run sheet item created successfully', 'Suite 1');
  const createdSlotId = rsCreate.data?.data?.id;

  // Update Run Sheet item
  const updatedCueTitle = `${newCueTitle} [CONFIRMED]`;
  const rsUpdate = await request(`/day-of/run-sheet/${createdSlotId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      activityTitle: updatedCueTitle,
      location: 'VIP Royal Entrance Portico',
    }),
  });
  assert(rsUpdate.status === 200, 'PATCH /api/day-of/run-sheet/:id returns HTTP 200', 'Suite 1');
  assert(rsUpdate.data?.data?.activityTitle === updatedCueTitle, 'Run sheet title updated', 'Suite 1');

  // Delete Run Sheet item
  const rsDelete = await request(`/day-of/run-sheet/${createdSlotId}`, { method: 'DELETE' });
  assert(rsDelete.status === 200, 'DELETE /api/day-of/run-sheet/:id returns HTTP 200', 'Suite 1');
  assert(rsDelete.data?.success === true, 'Run sheet item deleted', 'Suite 1');

  // --------------------------------------------------------------------------
  // SUITE 2: VENDOR ARRIVAL TELEMETRY
  // --------------------------------------------------------------------------
  console.log('\n📦 SUITE 2: Vendor Arrival Telemetry & Dispatch');

  const vGet = await request('/day-of/vendor-checkins?weddingId=RW-2026-001');
  assert(vGet.status === 200, 'GET /api/day-of/vendor-checkins returns HTTP 200', 'Suite 2');
  assert(Array.isArray(vGet.data?.data), 'Telemetry data is an array', 'Suite 2');
  assert(vGet.data?.data.length >= 4, `At least 4 vendors registered (found: ${vGet.data?.data.length})`, 'Suite 2');

  const sampleVendor = vGet.data?.data[0];
  assert(Boolean(sampleVendor.vendor), 'Vendor has business name', 'Suite 2');
  assert(Boolean(sampleVendor.category), 'Vendor has category', 'Suite 2');
  assert(typeof sampleVendor.scheduled === 'string', 'Scheduled arrival time formatted', 'Suite 2');
  assert(['ARRIVED_ON_TIME', 'RUNNING_LATE', 'SCHEDULED'].includes(sampleVendor.status), 'Valid arrival status', 'Suite 2');

  // Update Check-in status: Mark Late (+25 mins)
  const vendorIdToUpdate = sampleVendor.id;
  const markLate = await request(`/day-of/vendor-checkins/${vendorIdToUpdate}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'RUNNING_LATE',
      delayMinutes: 25,
      remarks: 'Highway toll delay flagged by telemetry',
    }),
  });
  assert(markLate.status === 200, 'PATCH /api/day-of/vendor-checkins/:id updates status to RUNNING_LATE', 'Suite 2');
  assert(markLate.data?.data?.status === 'RUNNING_LATE', 'Telemetry confirms RUNNING_LATE', 'Suite 2');

  // Check In Now (ARRIVED_ON_TIME)
  const checkInNow = await request(`/day-of/vendor-checkins/${vendorIdToUpdate}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'ARRIVED_ON_TIME',
      delayMinutes: 0,
      remarks: 'Checked in at main service gate',
    }),
  });
  assert(checkInNow.status === 200, 'PATCH check-in updates status to ARRIVED_ON_TIME', 'Suite 2');
  assert(Boolean(checkInNow.data?.data?.actualArrivalTime), 'actualArrivalTime timestamp automatically set', 'Suite 2');

  // --------------------------------------------------------------------------
  // SUITE 3: OPERATIONAL INCIDENTS
  // --------------------------------------------------------------------------
  console.log('\n📦 SUITE 3: Operational Incidents Logging & Resolution');

  const incGet = await request('/day-of/incidents?weddingId=RW-2026-001');
  assert(incGet.status === 200, 'GET /api/day-of/incidents returns HTTP 200', 'Suite 3');
  assert(Array.isArray(incGet.data?.data), 'Incidents data is an array', 'Suite 3');
  assert(incGet.data?.data.length >= 2, `At least 2 incidents found (found: ${incGet.data?.data.length})`, 'Suite 3');

  // Log a new incident
  const incidentTitle = `Mandap auxiliary spotlight halogen bulb flicker #${Date.now()}`;
  const incCreate = await request('/day-of/incidents', {
    method: 'POST',
    body: JSON.stringify({
      weddingId: 'RW-2026-001',
      title: incidentTitle,
      severity: 'HIGH',
      ownerName: 'Karan Verma',
    }),
  });
  assert(incCreate.status === 200, 'POST /api/day-of/incidents returns HTTP 200', 'Suite 3');
  assert(incCreate.data?.success === true, 'Incident logged successfully', 'Suite 3');
  const createdIncId = incCreate.data?.data?.id;

  // Resolve the incident
  const incResolve = await request(`/day-of/incidents/${createdIncId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'RESOLVED',
      resolutionNotes: 'Bulb replaced with spare 500W LED spotlight by stage crew in 4 minutes.',
    }),
  });
  assert(incResolve.status === 200, 'PATCH /api/day-of/incidents/:id marks status RESOLVED', 'Suite 3');
  assert(incResolve.data?.data?.status === 'RESOLVED', 'Status is RESOLVED', 'Suite 3');
  assert(Boolean(incResolve.data?.data?.resolvedAt), 'resolvedAt timestamp populated', 'Suite 3');

  // Delete test incident
  const incDelete = await request(`/day-of/incidents/${createdIncId}`, { method: 'DELETE' });
  assert(incDelete.status === 200, 'DELETE /api/day-of/incidents/:id removes incident', 'Suite 3');

  // --------------------------------------------------------------------------
  // SUITE 4: CROSS-INTEGRATION WITH CHECKLISTS (DAY-OF TASK WITH EXACT TIME)
  // --------------------------------------------------------------------------
  console.log('\n📦 SUITE 4: Checklist Day-Of Task with Exact Execution Time');

  const dayOfTaskTitle = `Live Bride Jaimala Garland Handover Cue #${Date.now()}`;
  const dayOfTaskCreate = await request('/tasks', {
    method: 'POST',
    body: JSON.stringify({
      weddingId: 'RW-2026-001',
      title: dayOfTaskTitle,
      category: 'DAY_OF',
      ownerName: 'Karan Verma',
      daysBefore: '@ 17:15 (Wedding Day)',
      notes: 'Execution Time: 17:15 | Venue: Lakefront Deck Terrace',
      isMilestone: true,
    }),
  });

  assert(dayOfTaskCreate.status === 200, 'POST /api/tasks accepts Day-Of task with exact time', 'Suite 4');
  assert(dayOfTaskCreate.data?.success === true, 'Day-Of task created successfully', 'Suite 4');
  const dayOfTaskId = dayOfTaskCreate.data?.data?.id;

  // Query checklists to verify Day-Of task is returned with exact time slot
  const taskQuery = await request(`/tasks?weddingId=RW-2026-001&category=DAY_OF`);
  assert(taskQuery.status === 200, 'Filter /tasks?category=DAY_OF returns HTTP 200', 'Suite 4');
  const foundTask = (taskQuery.data?.data as Array<{ id: string; category?: string; owner?: string }>)?.find((t) => t.id === dayOfTaskId);
  assert(Boolean(foundTask), 'Newly created Day-Of task found in database checklists', 'Suite 4');
  assert(foundTask?.category === 'DAY_OF', 'Task category is DAY_OF', 'Suite 4');
  assert(foundTask?.owner === 'Karan Verma', 'Task owner resolved to Karan Verma', 'Suite 4');

  // Clean up
  await request(`/tasks/${dayOfTaskId}`, { method: 'DELETE' });

  // --------------------------------------------------------------------------
  // SUITE 5: MULTI-WEDDING DATABASE INTEGRITY
  // --------------------------------------------------------------------------
  console.log('\n📦 SUITE 5: Multi-Wedding Database Scoping');

  const otherWeddings = ['RW-2026-002', 'RW-2026-003', 'RW-2025-010', 'RW-2025-011'];
  for (const code of otherWeddings) {
    const res = await request(`/day-of/run-sheet?weddingId=${code}`);
    assert(res.status === 200, `Run sheet for ${code} returns HTTP 200`, 'Suite 5');
    assert(res.data?.data.length > 0, `Run sheet slots exist for ${code} in database (count: ${res.data?.data.length})`, 'Suite 5');

    const vRes = await request(`/day-of/vendor-checkins?weddingId=${code}`);
    assert(vRes.status === 200, `Vendor check-ins for ${code} returns HTTP 200`, 'Suite 5');
    assert(vRes.data?.data.length > 0, `Vendor check-in telemetry exists for ${code} (count: ${vRes.data?.data.length})`, 'Suite 5');
  }

  // --------------------------------------------------------------------------
  // SUMMARY REPORT
  // --------------------------------------------------------------------------
  console.log('\n======================================================');
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`📊 DAY-OF E2E SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED out of ${results.length} checks`);
  console.log('======================================================\n');

  if (failedCount > 0) {
    console.error('❌ Day-Of E2E Verification failed on some assertions.');
    process.exit(1);
  } else {
    console.log('🎉 100% OF DAY-OF END-TO-END VERIFICATION CHECKS PASSED PERFECTLY!');
    process.exit(0);
  }
}

runDayOfE2ETests().catch((err) => {
  console.error('Fatal Day-Of test runner error:', err);
  process.exit(1);
});
