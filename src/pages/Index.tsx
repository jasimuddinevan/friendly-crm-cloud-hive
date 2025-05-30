
import { useState, useEffect } from 'react';
import { CRMDashboard } from '../components/CRMDashboard';
import { ContactsView } from '../components/ContactsView';
import { LeadsView } from '../components/LeadsView';
import { TasksView } from '../components/TasksView';
import { CompaniesView } from '../components/CompaniesView';
import { DataManager } from '../components/DataManager';
import { Navigation } from '../components/Navigation';
import { Contact, Lead, Task, Company } from '../types/crm';
import { StorageService } from '../services/StorageService';
import { CloudSyncService } from '../services/CloudSyncService';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Load data from browser storage on component mount
    const loadData = () => {
      try {
        setContacts(StorageService.getContacts());
        setLeads(StorageService.getLeads());
        setTasks(StorageService.getTasks());
        setCompanies(StorageService.getCompanies());
      } catch (error) {
        toast({
          title: "Error loading data",
          description: "There was an issue loading your CRM data.",
          variant: "destructive"
        });
      }
    };

    loadData();
    
    // Initialize cloud sync if enabled
    CloudSyncService.initializeSync();
  }, []);

  const handleDataUpdate = () => {
    setContacts(StorageService.getContacts());
    setLeads(StorageService.getLeads());
    setTasks(StorageService.getTasks());
    setCompanies(StorageService.getCompanies());
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'contacts':
        return <ContactsView contacts={contacts} searchTerm={searchTerm} onDataUpdate={handleDataUpdate} />;
      case 'leads':
        return <LeadsView leads={leads} searchTerm={searchTerm} onDataUpdate={handleDataUpdate} />;
      case 'tasks':
        return <TasksView tasks={tasks} searchTerm={searchTerm} onDataUpdate={handleDataUpdate} />;
      case 'companies':
        return <CompaniesView companies={companies} searchTerm={searchTerm} onDataUpdate={handleDataUpdate} />;
      case 'data':
        return <DataManager onDataUpdate={handleDataUpdate} />;
      default:
        return <CRMDashboard contacts={contacts} leads={leads} tasks={tasks} companies={companies} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation 
        activeView={activeView} 
        setActiveView={setActiveView}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />
      <main className="container mx-auto px-4 py-8 flex-1 w-full">
        {renderActiveView()}
      </main>
      <footer className="w-full text-center py-4 bg-transparent mt-auto">
        <span className="text-gray-800 text-sm opacity-60 tracking-wide select-none">
          &copy; {new Date().getFullYear()} Jasim Uddin. All rights reserved.
        </span>
      </footer>
    </div>
  );
};

export default Index;
