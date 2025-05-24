
import * as XLSX from 'xlsx';
import { Contact, Lead, Task, Company } from '../types/crm';

export class ExcelService {
  static exportToExcel(data: {
    contacts: Contact[];
    leads: Lead[];
    tasks: Task[];
    companies: Company[];
  }): void {
    const workbook = XLSX.utils.book_new();

    // Create worksheets for each data type
    const contactsWS = XLSX.utils.json_to_sheet(data.contacts);
    const leadsWS = XLSX.utils.json_to_sheet(data.leads);
    const tasksWS = XLSX.utils.json_to_sheet(data.tasks);
    const companiesWS = XLSX.utils.json_to_sheet(data.companies);

    // Add worksheets to workbook
    XLSX.utils.book_append_sheet(workbook, contactsWS, 'Contacts');
    XLSX.utils.book_append_sheet(workbook, leadsWS, 'Leads');
    XLSX.utils.book_append_sheet(workbook, tasksWS, 'Tasks');
    XLSX.utils.book_append_sheet(workbook, companiesWS, 'Companies');

    // Write file
    const fileName = `crm-data-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  static async importFromExcel(file: File): Promise<{
    contacts: Contact[];
    leads: Lead[];
    tasks: Task[];
    companies: Company[];
  }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          
          const result = {
            contacts: [] as Contact[],
            leads: [] as Lead[],
            tasks: [] as Task[],
            companies: [] as Company[]
          };

          // Process each sheet
          if (workbook.SheetNames.includes('Contacts')) {
            const contactsData = XLSX.utils.sheet_to_json(workbook.Sheets['Contacts']);
            result.contacts = this.convertToContacts(contactsData);
          }

          if (workbook.SheetNames.includes('Leads')) {
            const leadsData = XLSX.utils.sheet_to_json(workbook.Sheets['Leads']);
            result.leads = this.convertToLeads(leadsData);
          }

          if (workbook.SheetNames.includes('Tasks')) {
            const tasksData = XLSX.utils.sheet_to_json(workbook.Sheets['Tasks']);
            result.tasks = this.convertToTasks(tasksData);
          }

          if (workbook.SheetNames.includes('Companies')) {
            const companiesData = XLSX.utils.sheet_to_json(workbook.Sheets['Companies']);
            result.companies = this.convertToCompanies(companiesData);
          }

          resolve(result);
        } catch (error) {
          reject(new Error('Failed to parse Excel file'));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsBinaryString(file);
    });
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
      tags: row.tags ? (typeof row.tags === 'string' ? row.tags.split(';') : []) : [],
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
}
