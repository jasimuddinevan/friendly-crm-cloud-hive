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

  private static buildCsvUrl(spreadsheetId: string, gid: string = '0'): string {
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
  }

  private static async fetchSheetData(url: string): Promise<any[]> {
    try {
      console.log('Fetching data from:', url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch sheet data: ${response.statusText}`);
      }
      
      const csvText = await response.text();
      console.log('CSV response received, length:', csvText.length);
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
      const values = this.parseCSVLine(lines[i]);
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

  private static parseCSVLine(line: string): string[] {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  private static convertToContacts(data: any[]): Contact[] {
    return data.map(row => ({
      id: row.id || crypto.randomUUID(),
      firstName: row.firstName || row.firstname || '',
      lastName: row.lastName || row.lastname || '',
      email: row.email || '',
      phone: row.phone || '',
      company: row.company || '',
      position: row.position || '',
      status: (row.status || 'active') as Contact['status'],
      tags: row.tags ? row.tags.split(';') : [],
      notes: row.notes || '',
      createdAt: row.createdAt || row.createdat || new Date().toISOString(),
      lastContact: row.lastContact || row.lastcontact || new Date().toISOString(),
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
      expectedCloseDate: row.expectedCloseDate || row.expectedclosedate || '',
      notes: row.notes || '',
      createdAt: row.createdAt || row.createdat || new Date().toISOString(),
      lastActivity: row.lastActivity || row.lastactivity || new Date().toISOString(),
      assignedTo: row.assignedTo || row.assignedto || '',
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
      dueDate: row.dueDate || row.duedate || '',
      createdAt: row.createdAt || row.createdat || new Date().toISOString(),
      completedAt: row.completedAt || row.completedat || undefined,
      relatedContactId: row.relatedContactId || row.relatedcontactid || undefined,
      relatedLeadId: row.relatedLeadId || row.relatedleadid || undefined,
      assignedTo: row.assignedTo || row.assignedto || '',
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
      zipCode: row.zipCode || row.zipcode || '',
      country: row.country || '',
      notes: row.notes || '',
      createdAt: row.createdAt || row.createdat || new Date().toISOString(),
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
    
    console.log('Starting import from sheet:', spreadsheetId);

    try {
      // Try to fetch data from different tabs
      // We'll try multiple GID combinations to find the right tabs
      const results = {
        contacts: [] as Contact[],
        leads: [] as Lead[],
        tasks: [] as Task[],
        companies: [] as Company[]
      };

      // Try different GIDs for each tab
      const tabGIDs = ['0', '1', '2', '3', '4', '5'];
      
      for (const gid of tabGIDs) {
        try {
          const url = this.buildCsvUrl(spreadsheetId, gid);
          const data = await this.fetchSheetData(url);
          
          if (data.length > 0) {
            const headers = Object.keys(data[0]).map(h => h.toLowerCase());
            console.log(`Tab ${gid} headers:`, headers);
            
            // Determine tab type based on headers
            if (headers.includes('firstname') || headers.includes('lastname')) {
              results.contacts = this.convertToContacts(data);
              console.log(`Found contacts in tab ${gid}:`, results.contacts.length);
            } else if (headers.includes('name') && headers.includes('probability')) {
              results.leads = this.convertToLeads(data);
              console.log(`Found leads in tab ${gid}:`, results.leads.length);
            } else if (headers.includes('title') && headers.includes('priority')) {
              results.tasks = this.convertToTasks(data);
              console.log(`Found tasks in tab ${gid}:`, results.tasks.length);
            } else if (headers.includes('industry') || headers.includes('revenue')) {
              results.companies = this.convertToCompanies(data);
              console.log(`Found companies in tab ${gid}:`, results.companies.length);
            }
          }
        } catch (error) {
          console.log(`Tab ${gid} not found or empty, skipping...`);
        }
      }

      return results;
    } catch (error) {
      console.error('Error importing from sheet:', error);
      throw new Error('Failed to import data from Google Sheet. Please check the URL and sheet permissions.');
    }
  }

  static async exportToSheet(sheetUrl: string, data: {
    contacts: Contact[];
    leads: Lead[];
    tasks: Task[];
    companies: Company[];
  }): Promise<void> {
    // Note: This is a limitation of browser-based apps
    // We cannot directly write to Google Sheets without proper API authentication
    // This would require a backend service with Google Sheets API access
    
    console.log('Export to Google Sheets requested:', {
      url: sheetUrl,
      dataCount: {
        contacts: data.contacts.length,
        leads: data.leads.length,
        tasks: data.tasks.length,
        companies: data.companies.length
      }
    });
    
    // For now, we'll log the data that would be synced
    // In a real implementation, you would need:
    // 1. Google Sheets API credentials
    // 2. Backend service to handle the API calls
    // 3. Proper authentication flow
    
    throw new Error('Direct export to Google Sheets requires backend API integration. Please use the manual export feature and copy data to your sheet.');
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
