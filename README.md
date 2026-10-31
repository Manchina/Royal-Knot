# The Royal Knot — Wedding Planning Management System

A unified digital operating system built for high-end luxury destination wedding agencies across Jaipur and Udaipur managing 400+ guests, 18+ vendors, multi-day ceremonies (Mehendi, Sangeet, Pheras, Reception), and multi-crore budgets.

---

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Zustand (auth & session store), TanStack Query v5.
- **Backend**: Fastify 5, `@fastify/jwt`, `@fastify/cors`, PostgreSQL (`pg` connection pool), `tsx`.
- **Database**: PostgreSQL 15+ (relational schema with 16 tables covering weddings, events, RFQs, vendor quotes, run sheets, and billing).
- **Design Philosophy**: Minimalist, high-end Airbnb-style UI (pure white backgrounds, crisp typography, `#FF385C` accents, zero technical clutter).

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v20 or higher (`node -v`)
- **npm**: v10 or higher (`npm -v`)
- **PostgreSQL**: v15 or higher running locally on port `5432`

---

### 2. Clone and Install Dependencies

```bash
git clone https://github.com/Manchina/Royal-Knot.git
cd Royal-Knot

# Install dependencies across root, client, and backend in one command:
npm run install:all
```

Alternatively, you can install individually:
```bash
npm install
cd client && npm install
cd ../backend && npm install
```

---

### 3. Database Setup (PostgreSQL)

1. Ensure your local PostgreSQL service is running:
   ```bash
   # Windows (PowerShell):
   Get-Service postgresql*
   # Or start if stopped:
   Start-Service postgresql-x64-17
   ```

2. Create the `royalknot` database:
   ```bash
   psql -U postgres -c "CREATE DATABASE royalknot;"
   ```

3. Initialize the database schema:
   ```bash
   psql -U postgres -d royalknot -f backend/src/db/schema.sql
   ```

---

### 4. Environment Configuration

Copy the example environment file in `backend`:

```bash
cp backend/.env.example backend/.env
```

Ensure `backend/.env` has your PostgreSQL credentials:
```env
PORT=5000
HOST=0.0.0.0
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/royalknot
CORS_ORIGIN=http://localhost:5173
```

---

### 5. Running the Application

You can start both frontend and backend concurrently from the root directory:

```bash
npm run dev
```

Or run them in separate terminals:

**Terminal 1 (Backend API):**
```bash
cd backend
npm run dev
# Running on http://localhost:5000 (API at http://localhost:5000/api)
```

**Terminal 2 (Client Application):**
```bash
cd client
npm run dev
# Running on http://localhost:5173
```

---

## 👥 Demo User Accounts & Roles

The system features 5 core operational roles. On the login screen (`http://localhost:5173/login`), click **"Need a demo account? Click to fill credentials"** or select a role from the dropdown:

| Role | Email | Password | Primary Responsibility |
| :--- | :--- | :--- | :--- |
| **Founder / Admin** (`FOUNDER_ADMIN`) | `rajveer@royalknot.in` | `royal2026` | Season P&L, 25-wedding profit matrix, vendor scorecard, cash flow |
| **Lead Wedding Planner** (`LEAD_PLANNER`) | `ananya@royalknot.in` | `royal2026` | Lead intake, 3 caterers RFQ matrix, 25+ automated task checklists |
| **Day-of Coordinator** (`COORDINATOR`) | `vikram@royalknot.in` | `royal2026` | Live minute-by-minute run sheet, vendor arrivals, incident firefighting |
| **Finance Manager** (`FINANCE_MANAGER`) | `rohit@royalknot.in` | `royal2026` | Milestone billing (Booking, Advance, Final), vendor bill matching, extra plates |
| **Client (Couple)** (`CLIENT`) | `siddharth@client.in` | `royal2026` | Couple decision room (caterer selection), itinerary, mobile agreement |

---

## 📂 Repository Structure

```
Royal-Knot/
├── README.md               # Setup & project documentation
├── plan.md                 # System architecture & challenge blueprint
├── backend/                # Fastify + TypeScript backend
│   ├── src/
│   │   ├── db/             # PostgreSQL connection pool & schema.sql
│   │   ├── routes/         # auth.ts, etc.
│   │   ├── seeds/          # Demo seed accounts & data
│   │   └── server.ts       # Fastify bootstrap on port 5000
│   └── package.json
└── client/                 # React 19 + Vite + Tailwind v4 frontend
    ├── src/
    │   ├── api/            # Centralized API client (calls port 5000 directly)
    │   ├── hooks/          # TanStack Query & auth hooks
    │   ├── store/          # Zustand auth & session store
    │   ├── routes/         # AppRoutes.tsx with ProtectedRoute
    │   ├── pages/          # Dashboard, Enquiries, Procurement, Tasks, DayOf, Billing, Settings
    │   └── components/     # Layout, TopBar, Sidebar, RoleSwitcher
    └── package.json
```

---

## 🛡 Git Conventions & Branching

- Feature branches: `feat/<feature-name>`
- PR target: `main`
- Sensitive files (`.env`, `node_modules`, `dist`) are strictly excluded via root `.gitignore`.
