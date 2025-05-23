
import { useState } from 'react';
import { StorageService } from '../services/StorageService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Download, FileText, Upload, AlertTriangle, Trash2, Database } from 'lucide-react';

// Helper to convert array to CSV
function arrayToCSV(arr: any[]): string {
  if (!arr.length) return '';
  const keys = Object.keys(arr[0]);
  const lines = [keys.join(',')];
  for (const obj of arr) {
    lines.push(keys.map(k => `"${(obj[k] ?? '').toString().replace(/"/g, '""')}"`).join(','));
  }
  return lines.join('\r\n');
}

// Helper to push to Google Sheets via Script URL
async function pushToGoogleSheet(sheetUrl: string, data: {contacts: any[]; leads: any[]; tasks: any[]; companies: any[]}) {
  try {
    await fetch(sheetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        csv_contacts: arrayToCSV(data.contacts),
        csv_leads: arrayToCSV(data.leads),
        csv_tasks: arrayToCSV(data.tasks),
        csv_companies: arrayToCSV(data.companies)
      })
    });
    toast({
      title: 'Cloud Push Completed',
      description: 'Data sent to Google Sheet. Check your sheet for updates.',
    });
  } catch (err) {
    toast({
      title: 'Cloud Push failed',
      description: 'Failed to push data to Google Sheet. Check the link and try again.',
      variant: "destructive",
    });
  }
}

interface DataManagerProps {
  onDataUpdate: () => void;
}

export const DataManager = ({ onDataUpdate }: DataManagerProps) => {
  const [importData, setImportData] = useState('');
  const [googleSheetUrl, setGoogleSheetUrl] = useState<string>('');
  const [isPushing, setIsPushing] = useState(false);

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

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportData(content);
    };
    reader.readAsText(file);
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

  const handlePush = async () => {
    if (!googleSheetUrl) {
      toast({
        title: "No URL provided",
        description: "Please enter your public Google Apps Script URL.",
        variant: "destructive"
      });
      return;
    }
    setIsPushing(true);

    const data = {
      contacts: StorageService.getContacts(),
      leads: StorageService.getLeads(),
      tasks: StorageService.getTasks(),
      companies: StorageService.getCompanies(),
    };

    await pushToGoogleSheet(googleSheetUrl, data);
    setIsPushing(false);
  };

  const stats = getStorageStats();

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Data Manager</h1>
        <p className="text-gray-600">Import, export, and manage your CRM data</p>
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
              Download all your CRM data as a JSON file. This includes contacts, leads, tasks, and companies.
            </p>
            <Button onClick={handleExport} className="w-full flex items-center space-x-2">
              <FileText size={16} />
              <span>Download CRM Data</span>
            </Button>
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
              Import CRM data from a JSON file. This will add to your existing data.
            </p>

            <div>
              <Label htmlFor="file-import">Upload JSON File</Label>
              <Input
                id="file-import"
                type="file"
                accept=".json"
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
              <span>Import Data</span>
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

      {/* Data Format Information */}
      <Card>
        <CardHeader>
          <CardTitle>Data Format Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Export Format:</strong> JSON file containing all contacts, leads, tasks, and companies</p>
            <p><strong>Import Format:</strong> JSON file with the same structure as exported data</p>
            <p><strong>Storage:</strong> All data is stored locally in your browser's localStorage</p>
            <p><strong>Backup:</strong> Regular exports are recommended to prevent data loss</p>
          </div>
        </CardContent>
      </Card>

      {/* Cloud Push (Google Sheet) */}
      <Card>
        <CardHeader>
          <CardTitle>Cloud Push (Google Sheet)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-4">
            <label className="block font-medium mb-1">Public Google Apps Script URL</label>
            <input
              type="text"
              value={googleSheetUrl}
              onChange={e => setGoogleSheetUrl(e.target.value)}
              placeholder="Paste your Google Apps Script POST endpoint"
              className="w-full border px-2 py-1 rounded"
            />
            <div className="text-xs text-gray-500 mb-2">
              <span>
                <b>Instructions:</b> Create a Google Sheet, set up a Google Apps Script Web App that accepts POST and writes CSV to the sheet. Paste the script's public endpoint here.<br/>
                <b>Note:</b> The script must parse the csv_contacts, etc. See documentation for a ready script.
              </span>
            </div>
            <Button onClick={handlePush} disabled={isPushing} className="w-full">
              {isPushing ? "Pushing..." : "Push to Google Sheet"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

