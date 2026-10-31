# The Royal Knot — System Architecture & Implementation Plan

> "Because running 25 luxury destination weddings across Jaipur and Udaipur via frantic WhatsApp groups and scribbled paper diaries is not 'rustic charm'—it is an impending cardiac event."

---

## 1. Executive Summary & Philosophy

**The Royal Knot** manages high-stakes, multi-crore destination weddings with 400+ guests, ~18 vendors per event, and multi-day ceremonies (Mehendi, Sangeet, Pheras, Reception). 

The goal of this system is to replace fragmented WhatsApp chats, forgotten Instagram DMs, paper checklists, manual PDF quote comparisons, and post-season financial guessing with a single, role-driven digital operating system.

### Tech Stack Alignment
* **Frontend**: React 18+ (TypeScript, Vite, Tailwind CSS, shadcn/ui component library, Radix UI primitives, Lucide Icons, TanStack Query, Zustand/Context for role & session state).
* **Backend**: Fastify (TypeScript, TypeBox / Zod schema validation, Fastify JWT & CORS). Swagger / OpenAPI omitted per specification for clean, zero-bloat runtime.
* **Database & ORM**: PostgreSQL with Drizzle ORM (Type-safe migrations, relational joins, high-performance transactional queries).

---

## 2. User Roles & Access Hierarchy

To keep planners focused on couples and field coordinators focused on late drummers, the platform enforces 5 distinct roles:

```
[Founder / Admin]
       │
       ├─── [Lead Wedding Planner]
       │           │
       │           └─── [Day-of Field Coordinator]
       │
       ├─── [Finance & Billing Manager]
       │
       └─── [Client (Couple / Family)] (Portal View)
```

### Role Breakdown

| Role | Primary Responsibility | Focus Area |
| :--- | :--- | :--- |
| **`FOUNDER_ADMIN`** | Season profitability, cash flow, agency master data, vendor ratings, executive reporting | Business health across all 25 weddings |
| **`LEAD_PLANNER`** | End-to-end wedding project delivery, lead intake, RFQ vendor comparison, task checklists | Wedding lifecycle from enquiry to wrap-up |
| **`COORDINATOR`** | Real-time big-day execution, minute-by-minute run sheet, vendor arrivals, incident firefighting | On-ground field operations |
| **`FINANCE_MANAGER`** | Milestone billing (Booking, Advance, Final), vendor advances, extra cost audits, balance settlement | Money in, money out, zero duplicate payments |
| **`CLIENT`** | View-only itinerary, digital quote approvals (e.g., caterer pick), invoice tracking, RSVPs | Peace of mind, transparency |

---

## 3. Sidebar Modules (Role-Gated Navigation)

The sidebar dynamically renders modules according to the authenticated user's active role.

### A. Sidebar Layout by Role

#### 1. Founder / Admin (`FOUNDER_ADMIN`)
* **Executive Dashboard**: Season-at-a-glance (25 weddings status, pipeline revenue, total margin, upcoming cash inflows/outflows).
* **Weddings Portfolio**: Master list of all weddings, package types, assigned lead planners, health indicator (On Schedule / At Risk).
* **Financial Intelligence**:
  * Profitability Matrix (Wedding-by-wedding net margin: Client Invoiced - Vendor Bills - Staff Hours).
  * Cash Flow Forecast (Receivables due vs vendor disbursement schedules).
* **Vendor Directory & Performance**: Preferred vendor network, ratings, historical pricing, on-time arrival scores.
* **Master System Settings**: Lookup tables, package definitions, checklist templates, stage payment rules, staff management.

#### 2. Lead Wedding Planner (`LEAD_PLANNER`)
* **Planner Dashboard**: My active weddings, pending enquiries, upcoming milestone deadlines, urgent tasks.
* **Lead & Enquiry Pipeline**:
  * Inbound Enquiries (Calls, Instagram, WhatsApp capture).
  * Consultations & Initial Proposals (Theme, budget range, guest count, rough dates).
* **Wedding Workspace (Project View)**:
  * Profile & Scope (Couple details, package type, guest count, venue).
  * Checklist & Tasks (Auto-generated 25+ tasks from master template, Kanban/list view, stage tracking).
  * Event Ceremonies (Multi-day sub-events: Mehendi, Sangeet, Haldi, Varmala, Reception).
* **Procurement & Vendor RFQs**:
  * Quote Comparison Matrix (Side-by-side line item comparison, e.g., 3 caterers with price per plate and overtime clauses).
  * Awarded Vendors (Direct link between chosen vendor and wedding).
* **Payment Schedules**: Milestone payment tracker (Booking deposit, 1-month advance, final post-event bill).

#### 3. Day-of Coordinator (`COORDINATOR`)
* **Big Day Command Center**:
  * Live Minute-by-Minute Run Sheet (Groom baraat, garland exchange, pheras, dinner, reception entrance).
  * Real-Time Vendor Check-In (Arrival board, live delay alerts, contact direct dial).
  * Headcount & Extra Plate Tracker (Contracted 400 vs actual 460 banquet audit).
  * Issue & Incident Log (Quick-capture: DJ power outage, missing florist generator, with instant assignment).
* **My Run-Sheets**: Offline-capable timeline view for active day-of weddings.

#### 4. Finance & Billing Manager (`FINANCE_MANAGER`)
* **Finance Dashboard**: Outstanding client payments, pending vendor disbursements, extra charges awaiting client invoice.
* **Client Invoicing**:
  * Stage 1: Booking Deposit.
  * Stage 2: Advance Payment (30 days prior).
  * Stage 3: Post-Wedding Settlement (+ extra plates, overtime DJ hours).
* **Vendor Accounts Payable**:
  * Purchase Orders & Agreed Quotes.
  * Advance Disbursements Log.
  * Final Bill Matching (Matched against agreed RFQ quotes to prevent duplicate or inflated claims).
* **Cost Reconciliation**: Post-event discrepancy resolution (Agreed vs Actuals).

#### 5. Client Portal (`CLIENT`)
* **Our Wedding**: High-level countdown, confirmed dates, venue details.
* **Decision Room**: Interactive vendor quote selection (Side-by-side caterer/decorator cards with one-click selection).
* **Itinerary**: Guest-facing schedule of events.
* **Invoices & Receipts**: Paid receipts and upcoming stage payments.

---

## 4. UI Skeleton & Layout Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ TopBar: [The Royal Knot Logo]  [Season: 2026-2027 ▼]    [Active Role Switcher] [User Profile] │
├──────────────────┬──────────────────────────────────────────────────────────────────────────┤
│ SIDEBAR          │ MAIN WORKSPACE VIEWPORT                                                  │
│                  │                                                                          │
│ ✦ Role: Planner  │ Breadcrumbs: Weddings > Sharma-Kapoor Wedding > Vendor RFQ Matrix        │
│                  │                                                                          │
│ ─ Navigation ─   │ ┌──────────────────────────────────────────────────────────────────────┐ │
│ ⊞ Dashboard      │ │ Action Bar: [+ New Quote Request]  [Export Comparison]  [Filter]      │ │
│ 👥 Enquiries     │ └──────────────────────────────────────────────────────────────────────┘ │
│ 💍 Weddings      │                                                                          │
│   ├ Overview     │ ┌───────────────────────┬───────────────────────┬──────────────────────┐ │
│   ├ Checklist    │ │ Caterer A (Royal Rasoi)│ Caterer B (Marwar K.) │ Caterer C (Jaipur B.)│ │
│   ├ Timeline     │ ├───────────────────────┼───────────────────────┼──────────────────────┤ │
│   └ Vendors/RFQ  │ │ Rate: ₹1,850 / plate  │ Rate: ₹2,100 / plate  │ Rate: ₹1,950 / plate │ │
│ 📋 Templates     │ │ Extra Hr: ₹15,000/hr  │ Extra Hr: ₹12,000/hr  │ Extra Hr: ₹20,000/hr │ │
│ 💳 Invoices      │ │ Status: Under Review  │ Status: Recommended   │ Status: Under Review │ │
│ ⚙ Settings       │ ├───────────────────────┼───────────────────────┼──────────────────────┤ │
│                  │ │ [Select as Winner]    │ [Select as Winner]    │ [Select as Winner]   │ │
│ ───────────────  │ └───────────────────────┴───────────────────────┴──────────────────────┘ │
│ ⎋ Logout         │                                                                          │
└──────────────────┴──────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Core PostgreSQL Schema Architecture

The database architecture is structured into:
1. **The System Master Table (`master_options`)**: Dynamic system-wide lookups avoiding hardcoded string enums in UI dropdowns.
2. **Core Domain Entities**: `users`, `clients`, `vendors`, `weddings`.
3. **Sub-Tables & Operational Entities**: Tasks, checklists, RFQs, quotes, live check-ins, invoices, and reconciliation.

```
                      ┌──────────────────────┐
                      │    master_options    │ (Lookup Master Table)
                      └──────────┬───────────┘
                                 │ referenced by
    ┌────────────────────────────┼───────────────────────────┐
    ▼                            ▼                           ▼
┌──────────────┐          ┌──────────────┐            ┌──────────────┐
│    users     │          │   vendors    │            │   clients    │
└──────┬───────┘          └──────┬───────┘            └──────┬───────┘
       │                         │                           │
       └───────────────┐         │         ┌─────────────────┘
                       ▼         ▼         ▼
                     ┌──────────────────────┐
                     │       weddings       │ (Central Domain Master)
                     └──────────┬───────────┘
                                │
        ┌───────────────────────┼───────────────────────┬──────────────────────┐
        ▼                       ▼                       ▼                      ▼
┌──────────────┐        ┌──────────────┐        ┌──────────────┐       ┌──────────────┐
│wedding_events│        │wedding_tasks │        │ rfq_requests │       │client_invoic.│
└──────────────┘        └──────────────┘        └──────┬───────┘       └──────┬───────┘
                                                       │                      │
                                                ┌──────┴───────┐       ┌──────┴───────┐
                                                ▼              ▼       ▼              ▼
                                          vendor_quotes   extra_costs  vendor_bills   payments
```

### Table 1: `master_options` (The Universal System Master)
Provides a clean, centralized table for all configurable options, package tiers, ceremony types, vendor types, and stage payment templates.

```sql
CREATE TABLE master_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(60) NOT NULL, -- 'PACKAGE_TYPE', 'CEREMONY_TYPE', 'VENDOR_CATEGORY', 'PAYMENT_STAGE', 'TASK_PHASE'
    option_key VARCHAR(60) NOT NULL, -- e.g. 'FULL_SERVICE', 'SANGEET', 'CATERING', 'ADVANCE_STAGE'
    label VARCHAR(120) NOT NULL, -- User-facing title, e.g. 'Full-Service Planning', 'Sangeet Ceremony'
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb, -- e.g. default % for payment stages: {"default_pct": 50, "days_before": 30}
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uk_category_key UNIQUE (category, option_key)
);
```

### Table 2: `users`
Agency staff, coordinators, and administrators with role-based access.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    role VARCHAR(40) NOT NULL, -- 'FOUNDER_ADMIN', 'LEAD_PLANNER', 'COORDINATOR', 'FINANCE_MANAGER', 'CLIENT'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table 3: `clients`
The bride, groom, or primary family point of contact.

```sql
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bride_name VARCHAR(100) NOT NULL,
    groom_name VARCHAR(100) NOT NULL,
    primary_contact_name VARCHAR(120) NOT NULL,
    email VARCHAR(120) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    city_of_residence VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table 4: `weddings` (The Primary Business Entity)
Every single wedding project in Jaipur, Udaipur, or other royal destinations.

```sql
CREATE TABLE weddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL, -- e.g. 'RW-2026-001'
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    lead_planner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    package_type VARCHAR(60) NOT NULL, -- FK/Key to master_options (e.g. 'FULL_SERVICE', 'DAY_OF')
    theme VARCHAR(100), -- 'Royal Heritage', 'Palace Chic', 'Regal Desert'
    destination_city VARCHAR(60) NOT NULL, -- 'Jaipur', 'Udaipur'
    primary_venue VARCHAR(200),
    
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    season_year INT NOT NULL, -- e.g. 2026
    
    estimated_guest_count INT NOT NULL DEFAULT 400,
    actual_banquet_headcount INT,
    
    total_budget NUMERIC(14, 2) NOT NULL, -- In Crores / Lakhs INR
    agency_fee NUMERIC(14, 2) NOT NULL,
    
    status VARCHAR(40) NOT NULL DEFAULT 'ENQUIRY', 
    -- 'ENQUIRY', 'PROPOSAL_SENT', 'BOOKED', 'IN_PLANNING', 'LIVE_BIG_DAY', 'POST_EVENT_AUDIT', 'COMPLETED', 'CANCELLED'
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table 5: Sub-Tables Attached to `weddings`

#### 5.1. `wedding_events` (Multi-day ceremonies)
```sql
CREATE TABLE wedding_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    ceremony_type VARCHAR(60) NOT NULL, -- FK to master_options: 'MEHENDI', 'HALDI', 'SANGEET', 'PHERAS', 'RECEPTION'
    event_name VARCHAR(120) NOT NULL,
    venue_hall VARCHAR(150),
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    lead_coordinator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    sort_order INT DEFAULT 0
);
```

#### 5.2. `master_task_templates` & `wedding_tasks` (Checklist System)
Solves the "rewriting checklists in paper diaries every wedding" problem.

```sql
-- Global blueprint templates (25+ standard tasks)
CREATE TABLE master_task_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_type VARCHAR(60) NOT NULL, -- 'FULL_SERVICE' or 'DAY_OF'
    category VARCHAR(60) NOT NULL, -- 'VENUE', 'DESIGN', 'VENDORS', 'CEREMONIES', 'PERMITS'
    title VARCHAR(200) NOT NULL,
    description TEXT,
    default_days_before_event INT NOT NULL, -- e.g. 60 days before start_date
    default_role VARCHAR(40) DEFAULT 'LEAD_PLANNER'
);

-- Instantiated tasks linked to a specific wedding
CREATE TABLE wedding_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(60) NOT NULL,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    due_date DATE,
    stage VARCHAR(30) NOT NULL DEFAULT 'TO_PLAN', -- 'TO_PLAN', 'IN_PROGRESS', 'REVIEW', 'DONE'
    is_milestone BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    notes TEXT
);
```

#### 5.3. `vendors`, `rfq_requests` & `vendor_quotes` (Quote Comparison Matrix)
Solves the "three caterers sending different PDFs on WhatsApp" problem.

```sql
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name VARCHAR(150) NOT NULL,
    category VARCHAR(60) NOT NULL, -- FK to master_options: 'CATERER', 'DECORATOR', 'DJ', 'DRUMMERS', 'MAKEUP', 'PHOTO'
    contact_person VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(120),
    city VARCHAR(60),
    rating_score NUMERIC(3, 2) DEFAULT 5.00,
    bank_account_info JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RFQ created by planner for a wedding requirement
CREATE TABLE rfq_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    service_category VARCHAR(60) NOT NULL, -- 'CATERING', 'DECOR', etc.
    event_id UUID REFERENCES wedding_events(id) ON DELETE SET NULL,
    description TEXT NOT NULL, -- e.g. 'Regional Rajasthani dinner for 400 guests'
    required_guest_count INT DEFAULT 400,
    status VARCHAR(30) DEFAULT 'OPEN', -- 'OPEN', 'EVALUATING', 'AWARDED', 'CANCELLED'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Structured quotes submitted by multiple vendors for the same RFQ
CREATE TABLE vendor_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rfq_id UUID NOT NULL REFERENCES rfq_requests(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
    
    quote_reference VARCHAR(50),
    base_cost NUMERIC(12, 2) NOT NULL,
    price_per_plate NUMERIC(8, 2), -- For caterers
    overtime_hourly_rate NUMERIC(8, 2), -- For DJ, sound, lights
    
    line_items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Structured breakdowns for side-by-side view
    inclusions TEXT,
    exclusions TEXT,
    
    status VARCHAR(30) DEFAULT 'PENDING', -- 'PENDING', 'SHORTLISTED', 'ACCEPTED', 'AUTO_REJECTED'
    decision_reason TEXT,
    decided_at TIMESTAMPTZ
);
```

#### 5.4. `day_of_run_sheet` & `vendor_checkins` (Day-of Operations)
Solves the "late DJ, missing generator, bride car in traffic" live chaos.

```sql
CREATE TABLE day_of_run_sheet (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    event_id UUID REFERENCES wedding_events(id) ON DELETE CASCADE,
    time_slot TIME NOT NULL,
    activity_title VARCHAR(150) NOT NULL,
    location VARCHAR(120),
    responsible_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    sort_order INT DEFAULT 0
);

CREATE TABLE day_of_vendor_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    event_id UUID REFERENCES wedding_events(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
    
    scheduled_arrival_time TIMESTAMPTZ NOT NULL,
    actual_arrival_time TIMESTAMPTZ,
    status VARCHAR(30) DEFAULT 'SCHEDULED', -- 'SCHEDULED', 'ON_TIME', 'RUNNING_LATE', 'ARRIVED', 'NO_SHOW'
    delay_minutes INT DEFAULT 0,
    staff_verifier_id UUID REFERENCES users(id) ON DELETE SET NULL,
    remarks TEXT
);

CREATE TABLE day_of_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    event_id UUID REFERENCES wedding_events(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL, -- 'Florist needs extra generator', 'Bride car delayed 20 min'
    severity VARCHAR(20) DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    status VARCHAR(30) DEFAULT 'REPORTED', -- 'REPORTED', 'INVESTIGATING', 'RESOLVED'
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);
```

#### 5.5. `client_invoices`, `vendor_bills` & `extra_costs` (Financial Integrity)
Solves the "advances missed, 60 extra guests, duplicate payouts" financial drain.

```sql
-- Client staged invoicing (Booking, Advance, Final)
CREATE TABLE client_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    stage_key VARCHAR(60) NOT NULL, -- 'BOOKING_DEPOSIT', 'PRE_WEDDING_ADVANCE', 'FINAL_SETTLEMENT'
    amount_due NUMERIC(12, 2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(30) DEFAULT 'UNPAID', -- 'UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE'
    paid_amount NUMERIC(12, 2) DEFAULT 0,
    paid_at TIMESTAMPTZ,
    payment_reference VARCHAR(100)
);

-- Extra expenses incurred during the event
CREATE TABLE wedding_extra_charges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    category VARCHAR(60) NOT NULL, -- 'EXTRA_PLATES', 'DJ_OVERTIME', 'GENERATOR_FUEL'
    description VARCHAR(200) NOT NULL,
    quantity NUMERIC(8, 2) NOT NULL, -- e.g. 60 extra plates or 2 extra hours
    unit_rate NUMERIC(10, 2) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    is_billed_to_client BOOLEAN DEFAULT FALSE,
    client_invoice_id UUID REFERENCES client_invoices(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Vendor Purchase Orders & Bills
CREATE TABLE vendor_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
    awarded_quote_id UUID REFERENCES vendor_quotes(id) ON DELETE SET NULL,
    
    agreed_base_amount NUMERIC(12, 2) NOT NULL,
    extra_charges_amount NUMERIC(12, 2) DEFAULT 0,
    total_payable NUMERIC(12, 2) NOT NULL,
    
    advance_paid NUMERIC(12, 2) DEFAULT 0,
    balance_due NUMERIC(12, 2) NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING', -- 'ADVANCE_PAID', 'FINAL_BILL_SUBMITTED', 'RECONCILED', 'SETTLED'
    reconciled_by UUID REFERENCES users(id) ON DELETE SET NULL,
    settled_at TIMESTAMPTZ
);
```

---

## 6. Project Directory Structure

```
Royal-Knot/
├── plan.md                               # Architectural Blueprint & Master Plan
├── backend/                              # Fastify + TypeScript + PostgreSQL
│   ├── src/
│   │   ├── config/                       # Environment variables, DB connection pool
│   │   ├── db/
│   │   │   ├── schema/                   # Drizzle ORM schemas (masterOptions, weddings, etc.)
│   │   │   └── migrations/               # Drizzle migration files
│   │   ├── modules/
│   │   │   ├── auth/                     # Authentication & role authorization plugin
│   │   │   ├── master-options/           # Master table options CRUD
│   │   │   ├── weddings/                 # Wedding lifecycle & sub-entities
│   │   │   ├── checklist/                # Task templates & wedding checklists
│   │   │   ├── rfq-quotes/               # RFQ generation, side-by-side comparison, award logic
│   │   │   ├── day-of/                   # Live minute-by-minute run-sheet & vendor check-in
│   │   │   ├── finance/                  # Client invoicing, vendor billing, profit analytics
│   │   │   └── reports/                  # Founder's season review & cash flow forecasting
│   │   ├── plugins/                      # Fastify JWT, CORS, Sensible (Lean, No Swagger)
│   │   └── app.ts                        # Fastify server bootstrap
│   ├── package.json
│   └── tsconfig.json
└── frontend/                             # React + Vite + TypeScript + Tailwind + shadcn/ui
    ├── src/
    │   ├── api/                          # TanStack Query hooks & Fastify API clients
    │   ├── components/
    │   │   ├── layout/                   # TopBar, Role-Gated Sidebar, Breadcrumbs
    │   │   ├── ui/                       # shadcn/ui primitives (button, card, dialog, badge, table, select, etc.)
    │   │   └── common/                   # RoleSwitcher, EmptyState, LoadingSkeleton
    │   ├── lib/
    │   │   └── utils.ts                  # shadcn/ui cn helper (clsx + twMerge)
    │   ├── context/                      # AuthContext, RoleContext
    │   ├── modules/
    │   │   ├── dashboard/                # Role-specific dashboard views
    │   │   ├── enquiries/                # Lead capture & proposal generation
    │   │   ├── weddings/                 # Wedding details, events, checklists
    │   │   ├── procurement/              # Side-by-side RFQ comparison matrix
    │   │   ├── day-of/                   # Minute-by-minute run-sheet & live check-in board
    │   │   ├── finance/                  # Milestone invoices, extra charges, bill reconciliation
    │   │   └── master-settings/          # Dynamic options manager (packages, ceremonies)
    │   ├── App.tsx
    │   └── main.tsx
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.ts
```

---

## 7. Next Steps & Approval Workflow

1. **Review Architecture**: User validates the role breakdown, sidebar modules, and master-to-sub-table schema relationships.
2. **Backend Foundation**: Initialize Fastify + TypeScript + PostgreSQL with Drizzle ORM schemas based on this document.
3. **Frontend Shell**: Initialize React + Vite + Tailwind with the responsive role-gated sidebar and navigation skeleton.
4. **Git Policy Reminder**: No `git push` will ever be executed without explicit user permission.
