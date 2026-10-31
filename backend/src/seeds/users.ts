export interface DemoUser {
  id: string;
  email: string;
  password: string;
  full_name: string;
  role: string;
  title: string;
}

export const DEMO_USERS: DemoUser[] = [
  {
    id: 'usr-founder-001',
    email: 'founder@royalknot.com',
    password: 'password123',
    full_name: 'Vikramaditya Rathore',
    role: 'FOUNDER',
    title: 'Founder & CEO',
  },
  {
    id: 'usr-admin-002',
    email: 'admin@royalknot.com',
    password: 'password123',
    full_name: 'Aditya Singhal',
    role: 'SUPER_ADMIN',
    title: 'Super Administrator',
  },
  {
    id: 'usr-planner-003',
    email: 'planner@royalknot.com',
    password: 'password123',
    full_name: 'Devika Sharma',
    role: 'LEAD_PLANNER',
    title: 'Lead Wedding Planner',
  },
  {
    id: 'usr-coord-004',
    email: 'coordinator@royalknot.com',
    password: 'password123',
    full_name: 'Karan Verma',
    role: 'COORDINATOR',
    title: 'Day-of Field Coordinator',
  },
  {
    id: 'usr-finance-005',
    email: 'finance@royalknot.com',
    password: 'password123',
    full_name: 'Anil Agarwal',
    role: 'FINANCE_MANAGER',
    title: 'Finance & Billing Head',
  },
  {
    id: 'usr-client-006',
    email: 'client@royalknot.com',
    password: 'password123',
    full_name: 'Aanya Singhania & Raghav Mehra',
    role: 'CLIENT',
    title: 'Bride & Groom Portal',
  },
];
