
import { useState } from 'react';
import { StorageService } from '../services/StorageService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Upload, Trash2, Database, FileText, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface DataManagerProps {
  onDataUpdate: () => void;
}

export const DataManager = ({ onDataUpdate }: DataManagerProps) => {
  const [importData, setImportData] = useState('');

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

  const stats = getStorageStats();

  return (
    <div className="space-y-6">
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
    </div>
  );
};
