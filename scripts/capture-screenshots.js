const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'docs', 'screenshots');

async function getAuthSession() {
  const res = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@royalknot.com', password: 'password123' }),
  });
  const data = await res.json();
  if (!data.success || !data.token) {
    throw new Error('Failed to login via API: ' + JSON.stringify(data));
  }
  return { token: data.token, user: data.user };
}

async function capture() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('Authenticating with backend...');
  const { token, user } = await getAuthSession();
  console.log('Authenticated as:', user.email, `(${user.role})`);

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  });

  // Inject authentication into localStorage for all protected pages
  await context.addInitScript(({ token, user }) => {
    localStorage.setItem('rk_jwt_token', token);
    localStorage.setItem('rk_user', JSON.stringify(user));
  }, { token, user });

  const page = await context.newPage();

  const pagesToCapture = [
    {
      name: '01-landing-page.png',
      url: 'http://localhost:5173/',
      waitSelector: 'h1',
      title: 'Luxury Public Landing Page & Experience',
    },
    {
      name: '02-executive-dashboard.png',
      url: 'http://localhost:5173/dashboard',
      waitSelector: 'h1',
      title: 'Founder Season Intelligence & P&L Dashboard',
    },
    {
      name: '03-crm-enquiries.png',
      url: 'http://localhost:5173/enquiries',
      waitSelector: 'h1',
      title: 'Client Enquiries & CRM Intake Pipeline',
    },
    {
      name: '04-weddings-registry.png',
      url: 'http://localhost:5173/weddings',
      waitSelector: 'h1',
      title: 'Active Wedding Projects Registry',
    },
    {
      name: '05-procurement-vendors.png',
      url: 'http://localhost:5173/procurement',
      waitSelector: 'h1',
      title: 'Procurement, Curated Vendors & RFQ Sourcing',
    },
    {
      name: '06-tasks-blueprint.png',
      url: 'http://localhost:5173/tasks',
      waitSelector: 'h1',
      title: '25+ Task Master Checklist & Blueprint Planner',
    },
    {
      name: '07-dayof-command-center.png',
      url: 'http://localhost:5173/day-of',
      waitSelector: 'h1',
      action: async (page) => {
        const select = page.locator('select').first();
        if (await select.isVisible()) {
          await select.selectOption({ index: 1 });
          await page.waitForTimeout(1200);
        }
      },
      title: 'Big Day Live Command Center & Telemetry',
    },
    {
      name: '08-billing-settlements.png',
      url: 'http://localhost:5173/billing',
      waitSelector: 'h1',
      title: 'Commercial Billing, PO Ledger & Settlements',
    },
  ];

  for (const item of pagesToCapture) {
    console.log(`Capturing [${item.title}] from ${item.url}...`);
    await page.goto(item.url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000); // Wait for animations and charts to render
    if (item.action) {
      await item.action(page);
    }
    
    const filePath = path.join(OUTPUT_DIR, item.name);
    await page.screenshot({ path: filePath, fullPage: false });
    console.log(`✓ Saved ${item.name}`);
  }

  // Also capture detail views if available
  try {
    console.log('Capturing Billing Project Detail Dossier...');
    await page.goto('http://localhost:5173/billing', { waitUntil: 'networkidle' });
    const firstRow = await page.locator('table tbody tr').first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      await page.waitForTimeout(1200);
      const detailPath = path.join(OUTPUT_DIR, '09-billing-project-dossier.png');
      await page.screenshot({ path: detailPath, fullPage: false });
      console.log('✓ Saved 09-billing-project-dossier.png');
    }
  } catch (err) {
    console.warn('Could not capture billing detail dossier:', err.message);
  }

  await browser.close();
  console.log('🎉 All screenshots captured successfully in:', OUTPUT_DIR);
}

capture().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
