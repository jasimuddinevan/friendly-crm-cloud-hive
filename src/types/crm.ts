
export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  status: 'active' | 'inactive' | 'lead';
  tags: string[];
  notes: string;
  createdAt: string;
  lastContact: string;
  source: string;
  value: number;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  source: string;
  value: number;
  probability: number;
  expectedCloseDate: string;
  notes: string;
  createdAt: string;
  lastActivity: string;
  assignedTo: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'call' | 'email' | 'meeting' | 'follow-up' | 'demo' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  dueDate: string;
  createdAt: string;
  completedAt?: string;
  relatedContactId?: string;
  relatedLeadId?: string;
  assignedTo: string;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  size: string;
  website: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  notes: string;
  createdAt: string;
  revenue: number;
  employees: number;
  status: 'prospect' | 'customer' | 'partner' | 'inactive';
}
