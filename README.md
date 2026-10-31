# The Royal Knot — Luxury Wedding Planning Operating System

> *"Running 25 luxury destination weddings across Jaipur and Udaipur via frantic WhatsApp groups and scribbled paper diaries is not 'rustic charm'—it is an impending operational cardiac event."*

**The Royal Knot** is a unified digital operating system built for high-end luxury wedding planning agencies in Rajasthan. Every season, the agency plans ~25 multi-day royal weddings across Jaipur and Udaipur with **400+ guests**, **18+ specialized vendors**, multi-day ceremonies (Mehendi, Sangeet, Pheras, Reception), and **multi-crore budgets**.

---

## 🎯 The Core Business Problem

High-end destination weddings have thousands of moving parts across months of planning and high-stakes live execution:

| The Old Way (Chaotic Reality) | The Royal Knot Solution |
| :--- | :--- |
| **Lost Inquiries:** Couples reach out on WhatsApp, phone calls, and Instagram DMs, and leads get forgotten. | **Unified Intake Pipeline:** Instant capture from public inquiry or manual entry, tracked to a single CRM record. |
| **Manual Quote Comparisons:** 3 caterers send inconsistent PDFs on WhatsApp, compared by hand. | **Side-by-Side RFQ Matrix:** Normalized rate-per-plate, overtime clauses, and 1-click winner award. |
| **Diary Checklists:** Planners rewrite 25+ repetitive tasks into paper notebooks for every new wedding. | **Instant Wedding Blueprint:** Automated 25+ task checklist across ceremony stages with due-date tracking. |
| **Big-Day Live Chaos:** Late DJ, missing generator, bride car delayed in traffic with zero real-time visibility. | **Big Day Command Center:** Live minute-by-minute run sheet, vendor arrival board, and incident dispatcher. |
| **Financial Leakage:** 60 unexpected guests attend banquet; vendor advances forgotten, invoices duplicated. | **Two-Way Bill Matching & Extra Plates Audit:** Headcount reconciliation and matched vendor purchase orders. |
| **Post-Season Guessing:** Founder only discovers which weddings were actually profitable months later. | **Founder Season Intelligence:** Real-time wedding-by-wedding P&L matrix, margins, and cash flow forecast. |

---

## 👥 The 5 Role-Gated Personas

The platform enforces 5 tailored roles to give each stakeholder exactly what they need:

```
                      [ FOUNDER / ADMIN ]
                      (Season P&L & Margins)
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
   [ LEAD WEDDING PLANNER ]            [ FINANCE & BILLING MANAGER ]
   (Enquiries, RFQs, Checklists)       (Staged Billing, Vendor Bills)
            │                                     │
            ▼                                     ▼
   [ DAY-OF FIELD COORDINATOR ]        [ CLIENT (COUPLE / FAMILY) ]
   (Live Run Sheet, Check-ins)         (Decision Room & Itinerary)
```

1. **Founder / Admin (`FOUNDER_ADMIN`)**: High-level agency oversight across all 25 weddings, total season revenue, gross margin %, upcoming cash flow, and vendor performance ratings.
2. **Lead Wedding Planner (`LEAD_PLANNER`)**: Full project delivery from initial enquiry to final wrap-up: lead management, digital contract signing, vendor RFQs, and automated checklists.
3. **Day-of Coordinator (`COORDINATOR`)**: Ground execution team at the palace: live minute-by-minute run sheet, gate check-in for vendors, and incident firefighting.
4. **Finance Manager (`FINANCE_MANAGER`)**: Commercial integrity: staged client billing (Booking, 30-Day Advance, Final Settlement), banquet extra plate billing, and vendor bill matching.
5. **Client Portal (`CLIENT`)**: Bride & groom decision room: review and approve caterer quotes, sign digital service contracts on mobile, and follow the event itinerary.

---

## 🔄 The End-to-End Wedding Lifecycle (The 5 Scenes in Motion)

The platform powers the complete chronological journey of a luxury destination wedding:

```
[ SCENE 1: INTAKE ] ──▶ [ SCENE 2: PROCUREMENT ] ──▶ [ SCENE 3: BLUEPRINT ] ──▶ [ SCENE 4: BIG DAY ] ──▶ [ SCENE 5: SETTLEMENT ]
  Couple Enquiry &        3 Caterers RFQ Matrix        25+ Auto Tasks &          Live Minute Run Sheet     60 Extra Plates Audit
  Mobile Agreement        1-Click Winner Award         Ceremonies Plan           Vendor Arrival Board      Vendor Bill Matching
```

### Scene 1: The First Consultation & Digital Agreement
- **Public Consultation (`/enquire`)**: Prospective couples submit target dates (e.g. Winter 2026), guest count (~400), destination city (Jaipur/Udaipur), dream theme (Royal Heritage, Palace Romance), and budget range without upfront login friction.
- **Planner CRM Inbox (`/enquiries`)**: Planners track enquiries across channels (WhatsApp, phone, Instagram).
- **Mobile Digital Agreement**: Before proprietary floor plans or vendor rates are shared, the couple signs the digital service agreement directly on their phone screen. The signed contract is automatically linked to their wedding record.

### Scene 2: Three Caterers, One Decision (Procurement)
- **Catering RFQ**: For a 400-guest regional Rajasthani banquet, the planner requests quotes from 3 curated caterers (*Royal Rasoi*, *Marwar Heritage Kitchens*, *Rajputana Feasts*).
- **Side-by-Side Matrix (`/procurement`)**: The system normalizes quotes into a line-by-line comparison:
  - Base price & **rate per plate** (₹1,850 vs ₹2,100 vs ₹1,950).
  - Overtime charges (₹12,000/hr vs ₹15,000/hr vs ₹20,000/hr).
  - Inclusions (chinaware, live counters, trained stewards).
- **1-Click Winner Award**: When the couple or planner selects the winner (*Marwar Kitchens*), competing quotes are auto-closed, and the winning contract is instantly bound to the wedding's procurement ledger.

### Scene 3: The Instant Wedding Plan (Automated Blueprint)
- **25+ Task Master Template (`/tasks`)**: When the booking deposit is paid, the system automatically instantiates a comprehensive 25-task checklist across ceremony phases:
  - *Venue & Permits:* Palace lawn contract, drone permissions, sound limiter clearance.
  - *Design & Decor:* Mandap floral blueprint, 3D acoustic layout.
  - *Vendors:* Menu tasting sessions, 12-member Jaipur Dhol Tasha troupe arrival.
  - *Ceremonies:* Priest (Pandit Ji) alignment, vintage groom entry carriage (Baggi) inspection.
- Tasks progress through structured stages: `TO_PLAN` ➔ `IN_PROGRESS` ➔ `REVIEW` ➔ `DONE`.

### Scene 4: The Big Day Schedule (Live Command Center)
- **Minute-by-Minute Run Sheet (`/day-of`)**: Detailed schedule covering 09:00 AM florist setup, 11:30 AM Haldi, 16:45 PM Baraat assembly, 17:30 PM Varmala, 19:00 PM Vedic Pheras, and 20:30 PM Banquet dinner.
- **Live Vendor Check-In Board**: Real-time arrival board tracking scheduled vs actual arrival. Immediately flags delays (e.g. *DJ sound truck running 25 mins late*).
- **Incident Logger & Firefighter**: Immediate incident logging and staff assignment (e.g., *“Florist needs auxiliary 20kVA generator for floodlights”* ➔ resolved in 15 mins).

### Scene 5: Paying Vendors, Extra Costs & Settlement
- **Staged Client Billing (`/billing`)**: 3 formal milestone invoices:
  1. *Booking Deposit (20%)* — locks palace and agency dates.
  2. *Pre-Wedding Advance (50%)* — disbursed 30 days prior for vendor advances.
  3. *Post-Wedding Settlement (30% + Extras)* — issued after the event.
- **Banquet Extra Plates Audit**: Reconciles the contracted 400 guests against the 460 actual banquet attendees (60 extra plates @ ₹2,100 = ₹1,26,000) and 2 hours DJ overtime added automatically to the client's final invoice.
- **Vendor Bill Matching**: Matches submitted vendor claims against agreed purchase orders to prevent duplicate payments or unverified extras.

### Scene 6: The Founder's Season Review (P&L Intelligence)
- **25-Wedding Profitability Matrix (`/dashboard`)**: Clear breakdown of each wedding:
  $$\text{Net Agency Profit} = \text{Client Invoiced} - \text{Vendor Bills} - \text{Staff Allocations}$$
- **Cash Flow Horizon**: Visual timeline comparing upcoming client receivables against committed vendor disbursement dates.
- **Vendor Performance Scorecard**: Historical on-time arrival scores and ratings across decorators, caterers, and DJs.

---

## 🗄 Relational PostgreSQL Database Architecture

The system is backed by a robust 16-table PostgreSQL schema:

```
                    ┌─────────────────────────┐
                    │     master_options      │ (Universal Category Master)
                    └────────────┬────────────┘
                                 │
     ┌───────────────────────────┼───────────────────────────┐
     ▼                           ▼                           ▼
┌──────────┐               ┌──────────┐                ┌──────────┐
│  users   │               │ vendors  │                │ clients  │
└────┬─────┘               └────┬─────┘                └────┬─────┘
     │                          │                           │
     └──────────────────────────┼───────────────────────────┘
                                ▼
                       ┌─────────────────┐
                       │    weddings     │ (Central Domain Entity)
                       └────────┬────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│wedding_events│        │wedding_tasks │        │ rfq_requests │
└──────────────┘        └──────────────┘        └───────┬──────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│day_of_run_sht│        │client_invoic.│        │vendor_quotes │
└──────────────┘        └───────┬──────┘        └───────┬──────┘
                                │                       │
                                ▼                       ▼
                        wedding_extra_chg          vendor_bills
```

- **Universal Auto-Seed on Startup**: Whenever the backend boots, it checks the database. If tables are empty, it automatically populates all 16 tables with complete luxury wedding mock data, active RFQs, and live checklists.

---

## 👥 Demo Accounts (Quick Login)

The system includes pre-seeded accounts for each operational role (Password for all: `password123`):

| Role | Email | Title & Focus |
| :--- | :--- | :--- |
| **Founder / Admin** | `founder@royalknot.com` | Vikramaditya Rathore — Founder & CEO (Season P&L, 25-Wedding Margins) |
| **Super Admin** | `admin@royalknot.com` | Aditya Singhal — System Administrator (Master Options, User Roles) |
| **Lead Planner** | `planner@royalknot.com` | Devika Sharma — Lead Wedding Planner (Enquiries, 3 Caterers RFQ, Tasks) |
| **Day-of Coordinator** | `coordinator@royalknot.com` | Karan Verma — Day-of Field Coordinator (Live Run Sheet, Check-in Board) |
| **Finance Manager** | `finance@royalknot.com` | Anil Agarwal — Finance & Billing Head (Milestone Invoices, Extra Plates) |
| **Client (Couple)** | `client@royalknot.com` | Aanya Singhania & Raghav Mehra — Couple Decision Room & Itinerary |

*(Note: On the login screen, click **"Need a demo account?"** to autofill credentials with 1 click).*

---

## 🚀 Quick Start (Running Locally)

```bash
# 1. Clone repository
git clone https://github.com/Manchina/Royal-Knot.git
cd Royal-Knot

# 2. Install dependencies across root, client, and backend
npm run install:all

# 3. Setup backend environment (.env)
cp backend/.env.example backend/.env
# Verify your DATABASE_URL in backend/.env points to your PostgreSQL instance

# 4. Start frontend and backend concurrently
npm run dev
```

- **Frontend Client**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000/api`
