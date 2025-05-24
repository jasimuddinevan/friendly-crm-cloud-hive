
import { StorageService } from './StorageService';
import { GoogleSheetsAuthService, AuthenticatedSyncConfig } from './GoogleSheetsAuthService';
import { Contact, Lead, Task, Company } from '../types/crm';

export class CloudSyncService {
  private static syncInterval: NodeJS.Timeout | null = null;

  static getSyncConfig(): AuthenticatedSyncConfig | null {
    return GoogleSheetsAuthService.getSyncConfig();
  }

  static async enableSync(): Promise<void> {
    try {
      // Authenticate and set up Google Sheets
      const { user, spreadsheetId } = await GoogleSheetsAuthService.setupAuthentication();
      
      // Do initial sync
      await this.performSync(spreadsheetId);
      
      const config: AuthenticatedSyncConfig = {
        spreadsheetId,
        isEnabled: true,
        lastSync: new Date().toISOString(),
        syncInterval: 3, // 3 minutes
        user
      };
      
      GoogleSheetsAuthService.saveSyncConfig(config);
      this.startAutoSync();
      
      console.log('Cloud sync enabled successfully');
    } catch (error) {
      console.error('Failed to enable sync:', error);
      throw error;
    }
  }

  static async disableSync(): Promise<void> {
    const config = this.getSyncConfig();
    if (config) {
      config.isEnabled = false;
      GoogleSheetsAuthService.saveSyncConfig(config);
    }
    
    this.stopAutoSync();
    await GoogleSheetsAuthService.signOut();
    console.log('Cloud sync disabled');
  }

  static startAutoSync(): void {
    const config = this.getSyncConfig();
    if (!config || !config.isEnabled) return;

    this.stopAutoSync(); // Clear any existing interval
    
    this.syncInterval = setInterval(async () => {
      try {
        await this.performSync(config.spreadsheetId);
        config.lastSync = new Date().toISOString();
        GoogleSheetsAuthService.saveSyncConfig(config);
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

  private static async performSync(spreadsheetId: string): Promise<void> {
    try {
      const data = {
        contacts: StorageService.getContacts(),
        leads: StorageService.getLeads(),
        tasks: StorageService.getTasks(),
        companies: StorageService.getCompanies()
      };

      console.log('Performing sync to Google Sheets:', {
        spreadsheetId,
        contacts: data.contacts.length,
        leads: data.leads.length,
        tasks: data.tasks.length,
        companies: data.companies.length,
        timestamp: new Date().toISOString()
      });

      await GoogleSheetsAuthService.syncDataToSheets(data);
      
      console.log('Successfully synced data to Google Sheets');
    } catch (error) {
      console.error('Failed to sync to sheet:', error);
      throw error;
    }
  }

  static async importFromSheets(): Promise<{
    contacts: Contact[];
    leads: Lead[];
    tasks: Task[];
    companies: Company[];
  }> {
    return await GoogleSheetsAuthService.importDataFromSheets();
  }

  static initializeSync(): void {
    const config = this.getSyncConfig();
    if (config && config.isEnabled) {
      this.startAutoSync();
      console.log('Auto sync initialized from saved config');
    }
  }
}
