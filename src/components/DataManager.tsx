import { useState } from 'react';
import { StorageService } from '../services/StorageService';
import { GoogleSheetsService } from '../services/GoogleSheetsService';
import { ExcelService } from '../services/ExcelService';
import { CloudSyncService } from '../services/CloudSyncService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Download, FileText, Upload, AlertTriangle, Trash2, Database, Sheet, Info, Cloud, CloudOff } from 'lucide-react';

interface DataManagerProps {
  onDataUpdate: () => void;
}

export const DataManager = ({ onDataUpdate }: DataManagerProps) => {
  const [importData, setImportData] = useState('');
  const [googleSheetUrl, setGoogleSheetUrl] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const syncConfig = CloudSyncService.getSyncConfig();

  const handleExport = () => {
    try {
      const data = StorageService.exportAllData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `crm-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Data exported",
        description: "Your CRM data has been downloaded as a JSON file.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error exporting your data.",
        variant: "destructive"
      });
    }
  };

  const handleExcelExport = () => {
    try {
      const data = {
        contacts: StorageService.getContacts(),
        leads: StorageService.getLeads(),
        tasks: StorageService.getTasks(),
        companies: StorageService.getCompanies()
      };
      
      ExcelService.exportToExcel(data);

      toast({
        title: "Excel export successful",
        description: "Your CRM data has been downloaded as an Excel file.",
      });
    } catch (error) {
      toast({
        title: "Excel export failed",
        description: "There was an error exporting your data to Excel.",
        variant: "destructive"
      });
    }
  };

  const handleImport = () => {
    if (!importData.trim()) {
      toast({
        title: "No data provided",
        description: "Please paste your JSON data before importing.",
        variant: "destructive"
      });
      return;
    }

    try {
      const data = JSON.parse(importData);
      
      // Get existing data
      const existingContacts = StorageService.getContacts();
      const existingLeads = StorageService.getLeads();
      const existingTasks = StorageService.getTasks();
      const existingCompanies = StorageService.getCompanies();

      // Merge new data with existing data
      let addedCount = 0;
      
      if (data.contacts && Array.isArray(data.contacts)) {
        const newContacts = data.contacts.filter((newContact: any) => 
          !existingContacts.some(existing => existing.id === newContact.id)
        );
        StorageService.saveContacts([...existingContacts, ...newContacts]);
        addedCount += newContacts.length;
      }
      
      if (data.leads && Array.isArray(data.leads)) {
        const newLeads = data.leads.filter((newLead: any) => 
          !existingLeads.some(existing => existing.id === newLead.id)
        );
        StorageService.saveLeads([...existingLeads, ...newLeads]);
        addedCount += newLeads.length;
      }
      
      if (data.tasks && Array.isArray(data.tasks)) {
        const newTasks = data.tasks.filter((newTask: any) => 
          !existingTasks.some(existing => existing.id === newTask.id)
        );
        StorageService.saveTasks([...existingTasks, ...newTasks]);
        addedCount += newTasks.length;
      }
      
      if (data.companies && Array.isArray(data.companies)) {
        const newCompanies = data.companies.filter((newCompany: any) => 
          !existingCompanies.some(existing => existing.id === newCompany.id)
        );
        StorageService.saveCompanies([...existingCompanies, ...newCompanies]);
        addedCount += newCompanies.length;
      }

      onDataUpdate();
      setImportData('');
      
      toast({
        title: "Data imported successfully",
        description: `Added ${addedCount} new records. Existing data was preserved.`,
      });
    } catch (error) {
      toast({
        title: "Import failed",
        description: "Invalid JSON format. Please check your data and try again.",
        variant: "destructive"
      });
    }
  };

  const handleExcelImport = async (file: File) => {
    try {
      const data = await ExcelService.importFromExcel(file);
      
      // Get existing data
      const existingContacts = StorageService.getContacts();
      const existingLeads = StorageService.getLeads();
      const existingTasks = StorageService.getTasks();
      const existingCompanies = StorageService.getCompanies();

      // Merge new data with existing data, avoiding duplicates
      let addedCount = 0;
      
      if (data.contacts.length > 0) {
        const newContacts = data.contacts.filter(newContact => 
          !existingContacts.some(existing => existing.id === newContact.id)
        );
        StorageService.saveContacts([...existingContacts, ...newContacts]);
        addedCount += newContacts.length;
      }
      
      if (data.leads.length > 0) {
        const newLeads = data.leads.filter(newLead => 
          !existingLeads.some(existing => existing.id === newLead.id)
        );
        StorageService.saveLeads([...existingLeads, ...newLeads]);
        addedCount += newLeads.length;
      }
      
      if (data.tasks.length > 0) {
        const newTasks = data.tasks.filter(newTask => 
          !existingTasks.some(existing => existing.id === newTask.id)
        );
        StorageService.saveTasks([...existingTasks, ...newTasks]);
        addedCount += newTasks.length;
      }
      
      if (data.companies.length > 0) {
        const newCompanies = data.companies.filter(newCompany => 
          !existingCompanies.some(existing => existing.id === newCompany.id)
        );
        StorageService.saveCompanies([...existingCompanies, ...newCompanies]);
        addedCount += newCompanies.length;
      }
      
      onDataUpdate();
      
      toast({
        title: "Excel import successful",
        description: `Added ${addedCount} new records. Existing data was preserved.`,
      });
    } catch (error) {
      toast({
        title: "Excel import failed",
        description: error instanceof Error ? error.message : "Failed to import from Excel file.",
        variant: "destructive"
      });
    }
  };

  const handleGoogleSheetImport = async () => {
    if (!googleSheetUrl.trim()) {
      toast({
        title: "No URL provided",
        description: "Please enter your Google Sheets URL.",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    try {
      const data = await GoogleSheetsService.importFromSheet(googleSheetUrl);
      
      // Get existing data
      const existingContacts = StorageService.getContacts();
      const existingLeads = StorageService.getLeads();
      const existingTasks = StorageService.getTasks();
      const existingCompanies = StorageService.getCompanies();

      // Merge new data with existing data, avoiding duplicates
      let addedCount = 0;
      
      if (data.contacts.length > 0) {
        const newContacts = data.contacts.filter(newContact => 
          !existingContacts.some(existing => existing.id === newContact.id)
        );
        StorageService.saveContacts([...existingContacts, ...newContacts]);
        addedCount += newContacts.length;
      }
      
      if (data.leads.length > 0) {
        const newLeads = data.leads.filter(newLead => 
          !existingLeads.some(existing => existing.id === newLead.id)
        );
        StorageService.saveLeads([...existingLeads, ...newLeads]);
        addedCount += newLeads.length;
      }
      
      if (data.tasks.length > 0) {
        const newTasks = data.tasks.filter(newTask => 
          !existingTasks.some(existing => existing.id === newTask.id)
        );
        StorageService.saveTasks([...existingTasks, ...newTasks]);
        addedCount += newTasks.length;
      }
      
      if (data.companies.length > 0) {
        const newCompanies = data.companies.filter(newCompany => 
          !existingCompanies.some(existing => existing.id === newCompany.id)
        );
        StorageService.saveCompanies([...existingCompanies, ...newCompanies]);
        addedCount += newCompanies.length;
      }
      
      onDataUpdate();
      
      toast({
        title: "Import successful",
        description: `Added ${addedCount} new records from Google Sheets. Existing data was preserved.`,
      });
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import from Google Sheet.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleEnableSync = async () => {
    setIsSyncing(true);
    try {
      await CloudSyncService.enableSync();
      toast({
        title: "Cloud sync enabled",
        description: "Successfully authenticated with Google and created your sync spreadsheet. Data will now be automatically synced every 3 minutes.",
      });
    } catch (error) {
      toast({
        title: "Authentication failed",
        description: "Failed to authenticate with Google. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisableSync = async () => {
    try {
      await CloudSyncService.disableSync();
      toast({
        title: "Cloud sync disabled",
        description: "Automatic syncing has been turned off and you have been signed out.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disable sync properly.",
        variant: "destructive"
      });
    }
  };

  const handleImportFromSync = async () => {
    if (!syncConfig) {
      toast({
        title: "No sync configured",
        description: "Please enable cloud sync first.",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    try {
      const data = await CloudSyncService.importFromSheets();
      
      // Get existing data
      const existingContacts = StorageService.getContacts();
      const existingLeads = StorageService.getLeads();
      const existingTasks = StorageService.getTasks();
      const existingCompanies = StorageService.getCompanies();

      // Merge new data with existing data, avoiding duplicates
      let addedCount = 0;
      
      if (data.contacts.length > 0) {
        const newContacts = data.contacts.filter(newContact => 
          !existingContacts.some(existing => existing.id === newContact.id)
        );
        StorageService.saveContacts([...existingContacts, ...newContacts]);
        addedCount += newContacts.length;
      }
      
      if (data.leads.length > 0) {
        const newLeads = data.leads.filter(newLead => 
          !existingLeads.some(existing => existing.id === newLead.id)
        );
        StorageService.saveLeads([...existingLeads, ...newLeads]);
        addedCount += newLeads.length;
      }
      
      if (data.tasks.length > 0) {
        const newTasks = data.tasks.filter(newTask => 
          !existingTasks.some(existing => existing.id === newTask.id)
        );
        StorageService.saveTasks([...existingTasks, ...newTasks]);
        addedCount += newTasks.length;
      }
      
      if (data.companies.length > 0) {
        const newCompanies = data.companies.filter(newCompany => 
          !existingCompanies.some(existing => existing.id === newCompany.id)
        );
        StorageService.saveCompanies([...existingCompanies, ...newCompanies]);
        addedCount += newCompanies.length;
      }
      
      onDataUpdate();
      
      toast({
        title: "Import successful",
        description: `Added ${addedCount} new records from your synced Google Sheet.`,
      });
    } catch (error) {
      toast({
        title: "Import failed",
        description: "Failed to import from your synced Google Sheet.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      handleExcelImport(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setImportData(content);
      };
      reader.readAsText(file);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete ALL CRM data? This action cannot be undone.')) {
      StorageService.clearAllData();
      onDataUpdate();
      toast({
        title: "All data cleared",
        description: "Your CRM has been reset to an empty state.",
      });
    }
  };

  const getStorageStats = () => {
    const contacts = StorageService.getContacts();
    const leads = StorageService.getLeads();
    const tasks = StorageService.getTasks();
    const companies = StorageService.getCompanies();

    return {
      contacts: contacts.length,
      leads: leads.length,
      tasks: tasks.length,
      companies: companies.length,
      total: contacts.length + leads.length + tasks.length + companies.length
    };
  };

  const stats = getStorageStats();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Manager</h1>
        <p className="text-gray-600">Import, export, sync, and manage your CRM data</p>
      </div>

      {/* Storage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Storage Statistics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.contacts}</div>
              <div className="text-sm text-gray-600">Contacts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.leads}</div>
              <div className="text-sm text-gray-600">Leads</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.tasks}</div>
              <div className="text-sm text-gray-600">Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.companies}</div>
              <div className="text-sm text-gray-600">Companies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Records</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authenticated Cloud Sync */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-700">
            {syncConfig?.isEnabled ? <Cloud className="h-5 w-5" /> : <CloudOff className="h-5 w-5" />}
            <span>Google Cloud Sync</span>
            {syncConfig?.isEnabled && (
              <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded">Active</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-blue-700">
            {syncConfig?.isEnabled 
              ? `Auto-sync is enabled for ${syncConfig.user.name} (${syncConfig.user.email}). Data syncs every ${syncConfig.syncInterval} minutes to your Google Sheet.`
              : "Enable automatic backup to Google Sheets with one-click authentication. Your data will be synced every 3 minutes."
            }
          </p>
          
          {syncConfig?.isEnabled ? (
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                <p><strong>Spreadsheet ID:</strong> {syncConfig.spreadsheetId}</p>
                <p><strong>Last Sync:</strong> {new Date(syncConfig.lastSync).toLocaleString()}</p>
                <p><strong>User:</strong> {syncConfig.user.name} ({syncConfig.user.email})</p>
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleImportFromSync} variant="outline" disabled={isImporting}>
                  {isImporting ? "Importing..." : "Import from Synced Sheet"}
                </Button>
                <Button onClick={handleDisableSync} variant="outline">
                  Disable Cloud Sync
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-blue-600">
                Click below to authenticate with Google and automatically create a new spreadsheet for your CRM data.
              </p>
              <Button 
                onClick={handleEnableSync} 
                disabled={isSyncing}
                className="w-full"
              >
                {isSyncing ? "Authenticating..." : "🔗 Connect Google Account & Enable Sync"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Google Sheets Import (for existing sheets) */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-700">
            <Sheet className="h-5 w-5" />
            <span>Manual Google Sheets Import</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-green-700">
            Import data from an existing Google Sheet (different from your synced sheet). Data will be added to existing records.
          </p>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="sheet-url">Google Sheets Public Link</Label>
              <Input
                id="sheet-url"
                type="url"
                value={googleSheetUrl}
                onChange={(e) => setGoogleSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/your-sheet-id..."
                className="mt-1"
              />
            </div>
            
            <div className="flex space-x-2">
              <Button 
                onClick={handleGoogleSheetImport} 
                disabled={isImporting || !googleSheetUrl.trim()}
                className="flex-1"
              >
                {isImporting ? "Importing..." : "Import from Google Sheets"}
              </Button>
              <Button 
                onClick={() => setShowInstructions(!showInstructions)}
                variant="outline"
                size="icon"
              >
                <Info className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {showInstructions && (
            <Card className="bg-white border-green-200">
              <CardContent className="pt-4">
                <div className="text-sm space-y-2 text-gray-700">
                  <h4 className="font-semibold text-green-700">Setup Instructions:</h4>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Create a new Google Sheet</li>
                    <li>Create 4 tabs: "Contacts", "Leads", "Tasks", "Companies"</li>
                    <li>Add headers to each tab (see format below)</li>
                    <li>Make the sheet public: Share → Anyone with link → Viewer</li>
                    <li>Copy and paste the sheet URL above</li>
                  </ol>
                  
                  <div className="mt-3 p-2 bg-gray-100 rounded text-xs">
                    <p><strong>Required Headers:</strong></p>
                    <p><strong>Contacts:</strong> id, firstName, lastName, email, phone, company, position, status, tags, notes, createdAt, lastContact, source, value</p>
                    <p><strong>Leads:</strong> id, name, email, phone, company, status, source, value, probability, expectedCloseDate, notes, createdAt, lastActivity, assignedTo</p>
                    <p><strong>Tasks:</strong> id, title, description, type, priority, status, dueDate, createdAt, completedAt, relatedContactId, relatedLeadId, assignedTo</p>
                    <p><strong>Companies:</strong> id, name, industry, size, website, phone, email, address, city, state, zipCode, country, notes, createdAt, revenue, employees, status</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Download className="h-5 w-5" />
              <span>Export Data</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Download all your CRM data for backup or transfer.
            </p>
            <div className="space-y-2">
              <Button onClick={handleExport} className="w-full flex items-center space-x-2">
                <FileText size={16} />
                <span>Download as JSON</span>
              </Button>
              <Button onClick={handleExcelExport} variant="outline" className="w-full flex items-center space-x-2">
                <FileText size={16} />
                <span>Download as Excel</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Import Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Import Data</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Import CRM data from JSON or Excel files. New records will be added to existing data.
            </p>

            <div>
              <Label htmlFor="file-import">Upload File (JSON/Excel)</Label>
              <Input
                id="file-import"
                type="file"
                accept=".json,.xlsx,.xls"
                onChange={handleFileImport}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="json-data">Or Paste JSON Data</Label>
              <textarea
                id="json-data"
                className="w-full h-32 p-3 border border-gray-300 rounded-md text-sm font-mono"
                placeholder="Paste your JSON data here..."
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
              />
            </div>

            <Button 
              onClick={handleImport} 
              className="w-full flex items-center space-x-2"
              disabled={!importData.trim()}
            >
              <Upload size={16} />
              <span>Import JSON Data</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Danger Zone</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Permanently delete all CRM data. This action cannot be undone.
          </p>
          <Button 
            onClick={handleClearAll} 
            variant="destructive" 
            className="flex items-center space-x-2"
          >
            <Trash2 size={16} />
            <span>Clear All Data</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
