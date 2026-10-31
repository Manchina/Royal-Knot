-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table 1: Universal Master Options Table
CREATE TABLE IF NOT EXISTS master_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(60) NOT NULL,
    option_key VARCHAR(60) NOT NULL,
    label VARCHAR(120) NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uk_category_key UNIQUE (category, option_key)
);

-- Table 2: System Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    role VARCHAR(40) NOT NULL, -- 'SUPER_ADMIN', 'FOUNDER', 'LEAD_PLANNER', 'COORDINATOR', 'FINANCE_MANAGER', 'CLIENT'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 3: Clients (Couple / Point of Contact)
CREATE TABLE IF NOT EXISTS clients (
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

-- Table 4: Weddings
CREATE TABLE IF NOT EXISTS weddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    lead_planner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    package_type VARCHAR(60) NOT NULL,
    theme VARCHAR(100),
    destination_city VARCHAR(60) NOT NULL,
    primary_venue VARCHAR(200),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    season_year INT NOT NULL DEFAULT 2026,
    estimated_guest_count INT NOT NULL DEFAULT 400,
    actual_banquet_headcount INT,
    total_budget NUMERIC(14, 2) NOT NULL,
    agency_fee NUMERIC(14, 2) NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'ENQUIRY',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 5: Wedding Events (Sub-Ceremonies)
CREATE TABLE IF NOT EXISTS wedding_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    ceremony_type VARCHAR(60) NOT NULL,
    event_name VARCHAR(120) NOT NULL,
    venue_hall VARCHAR(150),
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    lead_coordinator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    sort_order INT DEFAULT 0
);

-- Table 6: Global Task Blueprint Templates
CREATE TABLE IF NOT EXISTS master_task_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_type VARCHAR(60) NOT NULL,
    category VARCHAR(60) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    default_days_before_event INT NOT NULL,
    default_role VARCHAR(40) DEFAULT 'LEAD_PLANNER'
);

-- Table 7: Wedding Checklist Tasks
CREATE TABLE IF NOT EXISTS wedding_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(60) NOT NULL,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    due_date DATE,
    stage VARCHAR(30) NOT NULL DEFAULT 'TO_PLAN',
    is_milestone BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    notes TEXT
);

-- Table 8: Vendors
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name VARCHAR(150) NOT NULL,
    category VARCHAR(60) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(120),
    city VARCHAR(60),
    rating_score NUMERIC(3, 2) DEFAULT 5.00,
    bank_account_info JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 9: RFQ Requests
CREATE TABLE IF NOT EXISTS rfq_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    service_category VARCHAR(60) NOT NULL,
    event_id UUID REFERENCES wedding_events(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    required_guest_count INT DEFAULT 400,
    status VARCHAR(30) DEFAULT 'OPEN',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 10: Vendor Quotes
CREATE TABLE IF NOT EXISTS vendor_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rfq_id UUID NOT NULL REFERENCES rfq_requests(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
    quote_reference VARCHAR(50),
    base_cost NUMERIC(12, 2) NOT NULL,
    price_per_plate NUMERIC(8, 2),
    overtime_hourly_rate NUMERIC(8, 2),
    line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    inclusions TEXT,
    exclusions TEXT,
    status VARCHAR(30) DEFAULT 'PENDING',
    decision_reason TEXT,
    decided_at TIMESTAMPTZ
);

-- Table 11: Day-of Run Sheet
CREATE TABLE IF NOT EXISTS day_of_run_sheet (
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

-- Table 12: Day-of Vendor Check-ins
CREATE TABLE IF NOT EXISTS day_of_vendor_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    event_id UUID REFERENCES wedding_events(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
    scheduled_arrival_time TIMESTAMPTZ NOT NULL,
    actual_arrival_time TIMESTAMPTZ,
    status VARCHAR(30) DEFAULT 'SCHEDULED',
    delay_minutes INT DEFAULT 0,
    staff_verifier_id UUID REFERENCES users(id) ON DELETE SET NULL,
    remarks TEXT
);

-- Table 13: Day-of Incidents
CREATE TABLE IF NOT EXISTS day_of_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    event_id UUID REFERENCES wedding_events(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    severity VARCHAR(20) DEFAULT 'MEDIUM',
    status VARCHAR(30) DEFAULT 'REPORTED',
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Table 14: Client Invoices
CREATE TABLE IF NOT EXISTS client_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    stage_key VARCHAR(60) NOT NULL,
    amount_due NUMERIC(12, 2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(30) DEFAULT 'UNPAID',
    paid_amount NUMERIC(12, 2) DEFAULT 0,
    paid_at TIMESTAMPTZ,
    payment_reference VARCHAR(100)
);

-- Table 15: Extra Charges
CREATE TABLE IF NOT EXISTS wedding_extra_charges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    category VARCHAR(60) NOT NULL,
    description VARCHAR(200) NOT NULL,
    quantity NUMERIC(8, 2) NOT NULL,
    unit_rate NUMERIC(10, 2) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    is_billed_to_client BOOLEAN DEFAULT FALSE,
    client_invoice_id UUID REFERENCES client_invoices(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Table 16: Vendor Bills
CREATE TABLE IF NOT EXISTS vendor_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
    awarded_quote_id UUID REFERENCES vendor_quotes(id) ON DELETE SET NULL,
    agreed_base_amount NUMERIC(12, 2) NOT NULL,
    extra_charges_amount NUMERIC(12, 2) DEFAULT 0,
    total_payable NUMERIC(12, 2) NOT NULL,
    advance_paid NUMERIC(12, 2) DEFAULT 0,
    balance_due NUMERIC(12, 2) NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING',
    reconciled_by UUID REFERENCES users(id) ON DELETE SET NULL,
    settled_at TIMESTAMPTZ
);
