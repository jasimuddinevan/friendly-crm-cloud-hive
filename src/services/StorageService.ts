
import { Contact, Lead, Task, Company } from '../types/crm';

export class StorageService {
  private static CONTACTS_KEY = 'crm_contacts';
  private static LEADS_KEY = 'crm_leads';
  private static TASKS_KEY = 'crm_tasks';
  private static COMPANIES_KEY = 'crm_companies';

  // Contacts
  static getContacts(): Contact[] {
    const data = localStorage.getItem(this.CONTACTS_KEY);
    return data ? JSON.parse(data) : [];
  }

  static saveContacts(contacts: Contact[]): void {
    localStorage.setItem(this.CONTACTS_KEY, JSON.stringify(contacts));
  }

  static addContact(contact: Contact): void {
    const contacts = this.getContacts();
    contacts.push(contact);
    this.saveContacts(contacts);
  }

  static updateContact(updatedContact: Contact): void {
    const contacts = this.getContacts();
    const index = contacts.findIndex(c => c.id === updatedContact.id);
    if (index !== -1) {
      contacts[index] = updatedContact;
      this.saveContacts(contacts);
    }
  }

  static deleteContact(id: string): void {
    const contacts = this.getContacts().filter(c => c.id !== id);
    this.saveContacts(contacts);
  }

  // Leads
  static getLeads(): Lead[] {
    const data = localStorage.getItem(this.LEADS_KEY);
    return data ? JSON.parse(data) : [];
  }

  static saveLeads(leads: Lead[]): void {
    localStorage.setItem(this.LEADS_KEY, JSON.stringify(leads));
  }

  static addLead(lead: Lead): void {
    const leads = this.getLeads();
    leads.push(lead);
    this.saveLeads(leads);
  }

  static updateLead(updatedLead: Lead): void {
    const leads = this.getLeads();
    const index = leads.findIndex(l => l.id === updatedLead.id);
    if (index !== -1) {
      leads[index] = updatedLead;
      this.saveLeads(leads);
    }
  }

  static deleteLead(id: string): void {
    const leads = this.getLeads().filter(l => l.id !== id);
    this.saveLeads(leads);
  }

  // Tasks
  static getTasks(): Task[] {
    const data = localStorage.getItem(this.TASKS_KEY);
    return data ? JSON.parse(data) : [];
  }

  static saveTasks(tasks: Task[]): void {
    localStorage.setItem(this.TASKS_KEY, JSON.stringify(tasks));
  }

  static addTask(task: Task): void {
    const tasks = this.getTasks();
    tasks.push(task);
    this.saveTasks(tasks);
  }

  static updateTask(updatedTask: Task): void {
    const tasks = this.getTasks();
    const index = tasks.findIndex(t => t.id === updatedTask.id);
    if (index !== -1) {
      tasks[index] = updatedTask;
      this.saveTasks(tasks);
    }
  }

  static deleteTask(id: string): void {
    const tasks = this.getTasks().filter(t => t.id !== id);
    this.saveTasks(tasks);
  }

  // Companies
  static getCompanies(): Company[] {
    const data = localStorage.getItem(this.COMPANIES_KEY);
    return data ? JSON.parse(data) : [];
  }

  static saveCompanies(companies: Company[]): void {
    localStorage.setItem(this.COMPANIES_KEY, JSON.stringify(companies));
  }

  static addCompany(company: Company): void {
    const companies = this.getCompanies();
    companies.push(company);
    this.saveCompanies(companies);
  }

  static updateCompany(updatedCompany: Company): void {
    const companies = this.getCompanies();
    const index = companies.findIndex(c => c.id === updatedCompany.id);
    if (index !== -1) {
      companies[index] = updatedCompany;
      this.saveCompanies(companies);
    }
  }

  static deleteCompany(id: string): void {
    const companies = this.getCompanies().filter(c => c.id !== id);
    this.saveCompanies(companies);
  }

  // Export/Import functionality
  static exportAllData(): string {
    const data = {
      contacts: this.getContacts(),
      leads: this.getLeads(),
      tasks: this.getTasks(),
      companies: this.getCompanies(),
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  static importAllData(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      if (data.contacts) this.saveContacts(data.contacts);
      if (data.leads) this.saveLeads(data.leads);
      if (data.tasks) this.saveTasks(data.tasks);
      if (data.companies) this.saveCompanies(data.companies);
    } catch (error) {
      throw new Error('Invalid data format');
    }
  }

  static clearAllData(): void {
    localStorage.removeItem(this.CONTACTS_KEY);
    localStorage.removeItem(this.LEADS_KEY);
    localStorage.removeItem(this.TASKS_KEY);
    localStorage.removeItem(this.COMPANIES_KEY);
  }
}
