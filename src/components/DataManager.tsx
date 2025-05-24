
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
  const [syncSheetUrl, setSyncSheetUrl] = useState<string>('');
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
      StorageService.importAllData(importData);
      onDataUpdate();
      setImportData('');
      toast({
        title: "Data imported",
        description: "Your CRM data has been successfully imported.",
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
      
      // Import the data
      if (data.contacts.length > 0) StorageService.saveContacts(data.contacts);
      if (data.leads.length > 0) StorageService.saveLeads(data.leads);
      if (data.tasks.length > 0) StorageService.saveTasks(data.tasks);
      if (data.companies.length > 0) StorageService.saveCompanies(data.companies);
      
      onDataUpdate();
      
      toast({
        title: "Excel import successful",
        description: `Imported ${data.contacts.length} contacts, ${data.leads.length} leads, ${data.tasks.length} tasks, and ${data.companies.length} companies.`,
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
      
      // Import the data
      if (data.contacts.length > 0) StorageService.saveContacts(data.contacts);
      if (data.leads.length > 0) StorageService.saveLeads(data.leads);
      if (data.tasks.length > 0) StorageService.saveTasks(data.tasks);
      if (data.companies.length > 0) StorageService.saveCompanies(data.companies);
      
      onDataUpdate();
      
      toast({
        title: "Import successful",
        description: `Imported ${data.contacts.length} contacts, ${data.leads.length} leads, ${data.tasks.length} tasks, and ${data.companies.length} companies.`,
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
    if (!syncSheetUrl.trim()) {
      toast({
        title: "No URL provided",
        description: "Please enter your Google Sheets URL for syncing.",
        variant: "destructive"
      });
      return;
    }

    setIsSyncing(true);
    try {
      await CloudSyncService.enableSync(syncSheetUrl);
      toast({
        title: "Cloud sync enabled",
        description: "Your data will now be automatically synced to Google Sheets every 3 minutes.",
      });
    } catch (error) {
      toast({
        title: "Sync setup failed",
        description: "Failed to set up cloud sync. Please check your sheet URL and permissions.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisableSync = () => {
    CloudSyncService.disableSync();
    toast({
      title: "Cloud sync disabled",
      description: "Automatic syncing has been turned off.",
    });
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

      {/* Cloud Sync */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-700">
            {syncConfig?.isEnabled ? <Cloud className="h-5 w-5" /> : <CloudOff className="h-5 w-5" />}
            <span>Cloud Sync</span>
            {syncConfig?.isEnabled && (
              <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded">Active</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-blue-700">
            {syncConfig?.isEnabled 
              ? `Auto-sync is enabled. Data syncs every ${syncConfig.syncInterval} minutes to your Google Sheet.`
              : "Enable automatic backup to Google Sheets. Your data will be synced every 3 minutes."
            }
          </p>
          
          {syncConfig?.isEnabled ? (
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                <p><strong>Sheet URL:</strong> {syncConfig.sheetUrl}</p>
                <p><strong>Last Sync:</strong> {new Date(syncConfig.lastSync).toLocaleString()}</p>
              </div>
              <Button onClick={handleDisableSync} variant="outline" className="w-full">
                Disable Cloud Sync
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label htmlFor="sync-url">Google Sheets URL for Sync</Label>
                <Input
                  id="sync-url"
                  type="url"
                  value={syncSheetUrl}
                  onChange={(e) => setSyncSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/your-sheet-id..."
                  className="mt-1"
                />
              </div>
              <Button 
                onClick={handleEnableSync} 
                disabled={isSyncing || !syncSheetUrl.trim()}
                className="w-full"
              >
                {isSyncing ? "Setting up..." : "Enable Cloud Sync"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Google Sheets Integration */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-700">
            <Sheet className="h-5 w-5" />
            <span>Google Sheets Import</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-green-700">
            Import data directly from your Google Sheets. No scripts required - just make your sheet public and paste the link.
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
              Import CRM data from JSON or Excel files. This will replace your existing data.
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
