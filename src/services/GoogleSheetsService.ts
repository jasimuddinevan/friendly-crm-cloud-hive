
import { Contact, Lead, Task, Company } from '../types/crm';

export interface GoogleSheetConfig {
  spreadsheetId: string;
  contactsRange: string;
  leadsRange: string;
  tasksRange: string;
  companiesRange: string;
}

export class GoogleSheetsService {
  private static extractSpreadsheetId(url: string): string {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      throw new Error('Invalid Google Sheets URL');
    }
    return match[1];
  }

  private static buildCsvUrl(spreadsheetId: string, gid: string): string {
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
  }

  private static async fetchSheetData(url: string): Promise<any[]> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch sheet data: ${response.statusText}`);
      }
      
      const csvText = await response.text();
      return this.parseCsv(csvText);
    } catch (error) {
      console.error('Error fetching sheet data:', error);
      throw error;
    }
  }

  private static parseCsv(csvText: string): any[] {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      if (Object.values(row).some(v => v !== '')) {
        data.push(row);
      }
    }

    return data;
  }

  private static convertToContacts(data: any[]): Contact[] {
    return data.map(row => ({
      id: row.id || crypto.randomUUID(),
      firstName: row.firstName || '',
      lastName: row.lastName || '',
      email: row.email || '',
      phone: row.phone || '',
      company: row.company || '',
      position: row.position || '',
      status: (row.status || 'active') as Contact['status'],
      tags: row.tags ? row.tags.split(';') : [],
      notes: row.notes || '',
      createdAt: row.createdAt || new Date().toISOString(),
      lastContact: row.lastContact || new Date().toISOString(),
      source: row.source || '',
      value: Number(row.value) || 0,
    }));
  }

  private static convertToLeads(data: any[]): Lead[] {
    return data.map(row => ({
      id: row.id || crypto.randomUUID(),
      name: row.name || '',
      email: row.email || '',
      phone: row.phone || '',
      company: row.company || '',
      status: (row.status || 'new') as Lead['status'],
      source: row.source || '',
      value: Number(row.value) || 0,
      probability: Number(row.probability) || 0,
      expectedCloseDate: row.expectedCloseDate || '',
      notes: row.notes || '',
      createdAt: row.createdAt || new Date().toISOString(),
      lastActivity: row.lastActivity || new Date().toISOString(),
      assignedTo: row.assignedTo || '',
    }));
  }

  private static convertToTasks(data: any[]): Task[] {
    return data.map(row => ({
      id: row.id || crypto.randomUUID(),
      title: row.title || '',
      description: row.description || '',
      type: (row.type || 'other') as Task['type'],
      priority: (row.priority || 'medium') as Task['priority'],
      status: (row.status || 'pending') as Task['status'],
      dueDate: row.dueDate || '',
      createdAt: row.createdAt || new Date().toISOString(),
      completedAt: row.completedAt || undefined,
      relatedContactId: row.relatedContactId || undefined,
      relatedLeadId: row.relatedLeadId || undefined,
      assignedTo: row.assignedTo || '',
    }));
  }

  private static convertToCompanies(data: any[]): Company[] {
    return data.map(row => ({
      id: row.id || crypto.randomUUID(),
      name: row.name || '',
      industry: row.industry || '',
      size: row.size || '',
      website: row.website || '',
      phone: row.phone || '',
      email: row.email || '',
      address: row.address || '',
      city: row.city || '',
      state: row.state || '',
      zipCode: row.zipCode || '',
      country: row.country || '',
      notes: row.notes || '',
      createdAt: row.createdAt || new Date().toISOString(),
      revenue: Number(row.revenue) || 0,
      employees: Number(row.employees) || 0,
      status: (row.status || 'prospect') as Company['status'],
    }));
  }

  static async importFromSheet(sheetUrl: string): Promise<{
    contacts: Contact[];
    leads: Lead[];
    tasks: Task[];
    companies: Company[];
  }> {
    const spreadsheetId = this.extractSpreadsheetId(sheetUrl);
    
    // Default GIDs for different tabs (users can modify these)
    const tabs = {
      contacts: '0',      // First tab
      leads: '1579801802', // Second tab  
      tasks: '1579801803', // Third tab
      companies: '1579801804' // Fourth tab
    };

    try {
      const [contactsData, leadsData, tasksData, companiesData] = await Promise.all([
        this.fetchSheetData(this.buildCsvUrl(spreadsheetId, tabs.contacts)),
        this.fetchSheetData(this.buildCsvUrl(spreadsheetId, tabs.leads)),
        this.fetchSheetData(this.buildCsvUrl(spreadsheetId, tabs.tasks)),
        this.fetchSheetData(this.buildCsvUrl(spreadsheetId, tabs.companies))
      ]);

      return {
        contacts: this.convertToContacts(contactsData),
        leads: this.convertToLeads(leadsData),
        tasks: this.convertToTasks(tasksData),
        companies: this.convertToCompanies(companiesData)
      };
    } catch (error) {
      console.error('Error importing from sheet:', error);
      throw new Error('Failed to import data from Google Sheet. Please check the URL and sheet permissions.');
    }
  }

  static generateSheetTemplate(): string {
    return `
=== GOOGLE SHEETS SETUP INSTRUCTIONS ===

1. Create a new Google Sheet
2. Create 4 tabs with these exact names: "Contacts", "Leads", "Tasks", "Companies"
3. Add the following headers to each tab:

CONTACTS TAB:
id, firstName, lastName, email, phone, company, position, status, tags, notes, createdAt, lastContact, source, value

LEADS TAB:
id, name, email, phone, company, status, source, value, probability, expectedCloseDate, notes, createdAt, lastActivity, assignedTo

TASKS TAB:
id, title, description, type, priority, status, dueDate, createdAt, completedAt, relatedContactId, relatedLeadId, assignedTo

COMPANIES TAB:
id, name, industry, size, website, phone, email, address, city, state, zipCode, country, notes, createdAt, revenue, employees, status

4. Make the sheet public:
   - Click "Share" button
   - Change to "Anyone with the link"
   - Set permission to "Viewer"
   - Copy the link

5. Paste the link in the CRM to import/sync data
    `;
  }
}
