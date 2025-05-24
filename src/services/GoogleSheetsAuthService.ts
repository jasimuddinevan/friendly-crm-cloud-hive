
import { Contact, Lead, Task, Company } from '../types/crm';
import { GoogleAuthService, GoogleUser } from './GoogleAuthService';

export interface AuthenticatedSyncConfig {
  spreadsheetId: string;
  isEnabled: boolean;
  lastSync: string;
  syncInterval: number;
  user: GoogleUser;
}

export class GoogleSheetsAuthService {
  private static SYNC_CONFIG_KEY = 'crm_auth_sync_config';

  static getSyncConfig(): AuthenticatedSyncConfig | null {
    const config = localStorage.getItem(this.SYNC_CONFIG_KEY);
    return config ? JSON.parse(config) : null;
  }

  static saveSyncConfig(config: AuthenticatedSyncConfig): void {
    localStorage.setItem(this.SYNC_CONFIG_KEY, JSON.stringify(config));
  }

  static async setupAuthentication(): Promise<{ user: GoogleUser; spreadsheetId: string }> {
    try {
      const user = await GoogleAuthService.signIn();
      
      // Create a new spreadsheet for the CRM
      const spreadsheetTitle = `CRM Data - ${user.name} - ${new Date().toISOString().split('T')[0]}`;
      const spreadsheetId = await GoogleAuthService.createSpreadsheet(spreadsheetTitle);
      
      // Set up headers for each sheet
      await this.setupSheetHeaders(spreadsheetId);
      
      return { user, spreadsheetId };
    } catch (error) {
      console.error('Authentication setup failed:', error);
      throw error;
    }
  }

  private static async setupSheetHeaders(spreadsheetId: string): Promise<void> {
    const contactHeaders = [
      'id', 'firstName', 'lastName', 'email', 'phone', 'company', 'position', 
      'status', 'tags', 'notes', 'createdAt', 'lastContact', 'source', 'value'
    ];
    
    const leadHeaders = [
      'id', 'name', 'email', 'phone', 'company', 'status', 'source', 'value', 
      'probability', 'expectedCloseDate', 'notes', 'createdAt', 'lastActivity', 'assignedTo'
    ];
    
    const taskHeaders = [
      'id', 'title', 'description', 'type', 'priority', 'status', 'dueDate', 
      'createdAt', 'completedAt', 'relatedContactId', 'relatedLeadId', 'assignedTo'
    ];
    
    const companyHeaders = [
      'id', 'name', 'industry', 'size', 'website', 'phone', 'email', 'address', 
      'city', 'state', 'zipCode', 'country', 'notes', 'createdAt', 'revenue', 'employees', 'status'
    ];

    await GoogleAuthService.writeToSheet(spreadsheetId, 'Contacts', [contactHeaders]);
    await GoogleAuthService.writeToSheet(spreadsheetId, 'Leads', [leadHeaders]);
    await GoogleAuthService.writeToSheet(spreadsheetId, 'Tasks', [taskHeaders]);
    await GoogleAuthService.writeToSheet(spreadsheetId, 'Companies', [companyHeaders]);
  }

  static async syncDataToSheets(data: {
    contacts: Contact[];
    leads: Lead[];
    tasks: Task[];
    companies: Company[];
  }): Promise<void> {
    const config = this.getSyncConfig();
    if (!config) throw new Error('No sync configuration found');

    try {
      // Convert contacts to array format
      const contactRows = [
        ['id', 'firstName', 'lastName', 'email', 'phone', 'company', 'position', 
         'status', 'tags', 'notes', 'createdAt', 'lastContact', 'source', 'value'],
        ...data.contacts.map(contact => [
          contact.id, contact.firstName, contact.lastName, contact.email, contact.phone,
          contact.company, contact.position, contact.status, contact.tags.join(';'),
          contact.notes, contact.createdAt, contact.lastContact, contact.source, contact.value.toString()
        ])
      ];

      // Convert leads to array format
      const leadRows = [
        ['id', 'name', 'email', 'phone', 'company', 'status', 'source', 'value', 
         'probability', 'expectedCloseDate', 'notes', 'createdAt', 'lastActivity', 'assignedTo'],
        ...data.leads.map(lead => [
          lead.id, lead.name, lead.email, lead.phone, lead.company, lead.status,
          lead.source, lead.value.toString(), lead.probability.toString(), lead.expectedCloseDate,
          lead.notes, lead.createdAt, lead.lastActivity, lead.assignedTo
        ])
      ];

      // Convert tasks to array format
      const taskRows = [
        ['id', 'title', 'description', 'type', 'priority', 'status', 'dueDate', 
         'createdAt', 'completedAt', 'relatedContactId', 'relatedLeadId', 'assignedTo'],
        ...data.tasks.map(task => [
          task.id, task.title, task.description, task.type, task.priority, task.status,
          task.dueDate, task.createdAt, task.completedAt || '', task.relatedContactId || '',
          task.relatedLeadId || '', task.assignedTo
        ])
      ];

      // Convert companies to array format
      const companyRows = [
        ['id', 'name', 'industry', 'size', 'website', 'phone', 'email', 'address', 
         'city', 'state', 'zipCode', 'country', 'notes', 'createdAt', 'revenue', 'employees', 'status'],
        ...data.companies.map(company => [
          company.id, company.name, company.industry, company.size, company.website,
          company.phone, company.email, company.address, company.city, company.state,
          company.zipCode, company.country, company.notes, company.createdAt,
          company.revenue.toString(), company.employees.toString(), company.status
        ])
      ];

      // Write data to sheets
      await GoogleAuthService.writeToSheet(config.spreadsheetId, 'Contacts', contactRows);
      await GoogleAuthService.writeToSheet(config.spreadsheetId, 'Leads', leadRows);
      await GoogleAuthService.writeToSheet(config.spreadsheetId, 'Tasks', taskRows);
      await GoogleAuthService.writeToSheet(config.spreadsheetId, 'Companies', companyRows);

      console.log('Data synced successfully to Google Sheets');
    } catch (error) {
      console.error('Failed to sync data:', error);
      throw error;
    }
  }

  static async importDataFromSheets(): Promise<{
    contacts: Contact[];
    leads: Lead[];
    tasks: Task[];
    companies: Company[];
  }> {
    const config = this.getSyncConfig();
    if (!config) throw new Error('No sync configuration found');

    try {
      const [contactData, leadData, taskData, companyData] = await Promise.all([
        GoogleAuthService.readFromSheet(config.spreadsheetId, 'Contacts'),
        GoogleAuthService.readFromSheet(config.spreadsheetId, 'Leads'),
        GoogleAuthService.readFromSheet(config.spreadsheetId, 'Tasks'),
        GoogleAuthService.readFromSheet(config.spreadsheetId, 'Companies')
      ]);

      return {
        contacts: this.parseContacts(contactData),
        leads: this.parseLeads(leadData),
        tasks: this.parseTasks(taskData),
        companies: this.parseCompanies(companyData)
      };
    } catch (error) {
      console.error('Failed to import data:', error);
      throw error;
    }
  }

  private static parseContacts(data: any[][]): Contact[] {
    if (data.length <= 1) return [];
    return data.slice(1).map(row => ({
      id: row[0] || crypto.randomUUID(),
      firstName: row[1] || '',
      lastName: row[2] || '',
      email: row[3] || '',
      phone: row[4] || '',
      company: row[5] || '',
      position: row[6] || '',
      status: (row[7] || 'active') as Contact['status'],
      tags: row[8] ? row[8].split(';') : [],
      notes: row[9] || '',
      createdAt: row[10] || new Date().toISOString(),
      lastContact: row[11] || new Date().toISOString(),
      source: row[12] || '',
      value: Number(row[13]) || 0,
    }));
  }

  private static parseLeads(data: any[][]): Lead[] {
    if (data.length <= 1) return [];
    return data.slice(1).map(row => ({
      id: row[0] || crypto.randomUUID(),
      name: row[1] || '',
      email: row[2] || '',
      phone: row[3] || '',
      company: row[4] || '',
      status: (row[5] || 'new') as Lead['status'],
      source: row[6] || '',
      value: Number(row[7]) || 0,
      probability: Number(row[8]) || 0,
      expectedCloseDate: row[9] || '',
      notes: row[10] || '',
      createdAt: row[11] || new Date().toISOString(),
      lastActivity: row[12] || new Date().toISOString(),
      assignedTo: row[13] || '',
    }));
  }

  private static parseTasks(data: any[][]): Task[] {
    if (data.length <= 1) return [];
    return data.slice(1).map(row => ({
      id: row[0] || crypto.randomUUID(),
      title: row[1] || '',
      description: row[2] || '',
      type: (row[3] || 'other') as Task['type'],
      priority: (row[4] || 'medium') as Task['priority'],
      status: (row[5] || 'pending') as Task['status'],
      dueDate: row[6] || '',
      createdAt: row[7] || new Date().toISOString(),
      completedAt: row[8] || undefined,
      relatedContactId: row[9] || undefined,
      relatedLeadId: row[10] || undefined,
      assignedTo: row[11] || '',
    }));
  }

  private static parseCompanies(data: any[][]): Company[] {
    if (data.length <= 1) return [];
    return data.slice(1).map(row => ({
      id: row[0] || crypto.randomUUID(),
      name: row[1] || '',
      industry: row[2] || '',
      size: row[3] || '',
      website: row[4] || '',
      phone: row[5] || '',
      email: row[6] || '',
      address: row[7] || '',
      city: row[8] || '',
      state: row[9] || '',
      zipCode: row[10] || '',
      country: row[11] || '',
      notes: row[12] || '',
      createdAt: row[13] || new Date().toISOString(),
      revenue: Number(row[14]) || 0,
      employees: Number(row[15]) || 0,
      status: (row[16] || 'prospect') as Company['status'],
    }));
  }

  static async signOut(): Promise<void> {
    await GoogleAuthService.signOut();
    localStorage.removeItem(this.SYNC_CONFIG_KEY);
  }
}
