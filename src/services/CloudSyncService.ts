
import { StorageService } from './StorageService';
import { GoogleSheetsService } from './GoogleSheetsService';
import { Contact, Lead, Task, Company } from '../types/crm';

export interface SyncConfig {
  sheetUrl: string;
  isEnabled: boolean;
  lastSync: string;
  syncInterval: number; // minutes
}

export class CloudSyncService {
  private static SYNC_CONFIG_KEY = 'crm_sync_config';
  private static syncInterval: NodeJS.Timeout | null = null;

  static getSyncConfig(): SyncConfig | null {
    const config = localStorage.getItem(this.SYNC_CONFIG_KEY);
    return config ? JSON.parse(config) : null;
  }

  static saveSyncConfig(config: SyncConfig): void {
    localStorage.setItem(this.SYNC_CONFIG_KEY, JSON.stringify(config));
  }

  static async enableSync(sheetUrl: string): Promise<void> {
    try {
      // Test the connection first by doing an initial sync
      await this.syncToSheet(sheetUrl);
      
      const config: SyncConfig = {
        sheetUrl,
        isEnabled: true,
        lastSync: new Date().toISOString(),
        syncInterval: 3 // 3 minutes
      };
      
      this.saveSyncConfig(config);
      this.startAutoSync();
      
      console.log('Cloud sync enabled successfully');
    } catch (error) {
      console.error('Failed to enable sync:', error);
      throw error;
    }
  }

  static disableSync(): void {
    const config = this.getSyncConfig();
    if (config) {
      config.isEnabled = false;
      this.saveSyncConfig(config);
    }
    
    this.stopAutoSync();
    console.log('Cloud sync disabled');
  }

  static startAutoSync(): void {
    const config = this.getSyncConfig();
    if (!config || !config.isEnabled) return;

    this.stopAutoSync(); // Clear any existing interval
    
    this.syncInterval = setInterval(async () => {
      try {
        await this.syncToSheet(config.sheetUrl);
        config.lastSync = new Date().toISOString();
        this.saveSyncConfig(config);
        console.log('Auto sync completed:', new Date().toISOString());
      } catch (error) {
        console.error('Auto sync failed:', error);
      }
    }, config.syncInterval * 60 * 1000); // Convert minutes to milliseconds

    console.log(`Auto sync started with ${config.syncInterval} minute interval`);
  }

  static stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  private static async syncToSheet(sheetUrl: string): Promise<void> {
    try {
      const data = {
        contacts: StorageService.getContacts(),
        leads: StorageService.getLeads(),
        tasks: StorageService.getTasks(),
        companies: StorageService.getCompanies()
      };

      console.log('Attempting to sync data to sheet:', {
        url: sheetUrl,
        contacts: data.contacts.length,
        leads: data.leads.length,
        tasks: data.tasks.length,
        companies: data.companies.length,
        timestamp: new Date().toISOString()
      });

      // Use GoogleSheetsService to export data to the sheet
      await GoogleSheetsService.exportToSheet(sheetUrl, data);
      
      console.log('Successfully synced data to Google Sheets');
    } catch (error) {
      console.error('Failed to sync to sheet:', error);
      throw error;
    }
  }

  static initializeSync(): void {
    const config = this.getSyncConfig();
    if (config && config.isEnabled) {
      this.startAutoSync();
      console.log('Auto sync initialized from saved config');
    }
  }
}
