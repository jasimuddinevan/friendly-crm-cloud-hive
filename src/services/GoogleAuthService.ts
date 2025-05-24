
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

export interface GoogleUser {
  id: string;
  name: string;
  email: string;
  picture: string;
}

export class GoogleAuthService {
  private static CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  private static API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
  private static DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
  private static SCOPES = 'https://www.googleapis.com/auth/spreadsheets';
  
  private static isInitialized = false;
  private static authInstance: any = null;

  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load the Google API script
      await this.loadGoogleAPI();
      
      await window.gapi.load('auth2', async () => {
        await window.gapi.auth2.init({
          client_id: this.CLIENT_ID,
        });
        this.authInstance = window.gapi.auth2.getAuthInstance();
      });

      await window.gapi.load('client', async () => {
        await window.gapi.client.init({
          apiKey: this.API_KEY,
          clientId: this.CLIENT_ID,
          discoveryDocs: [this.DISCOVERY_DOC],
          scope: this.SCOPES
        });
      });

      this.isInitialized = true;
      console.log('Google API initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Google API:', error);
      throw error;
    }
  }

  private static loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google API script'));
      document.head.appendChild(script);
    });
  }

  static async signIn(): Promise<GoogleUser> {
    await this.initialize();
    
    try {
      const authResponse = await this.authInstance.signIn({
        scope: this.SCOPES
      });
      
      const profile = authResponse.getBasicProfile();
      const user: GoogleUser = {
        id: profile.getId(),
        name: profile.getName(),
        email: profile.getEmail(),
        picture: profile.getImageUrl()
      };

      console.log('User signed in:', user);
      return user;
    } catch (error) {
      console.error('Sign in failed:', error);
      throw new Error('Failed to sign in with Google');
    }
  }

  static async signOut(): Promise<void> {
    if (this.authInstance) {
      await this.authInstance.signOut();
      console.log('User signed out');
    }
  }

  static isSignedIn(): boolean {
    return this.authInstance?.isSignedIn.get() || false;
  }

  static getCurrentUser(): GoogleUser | null {
    if (!this.isSignedIn()) return null;
    
    const profile = this.authInstance.currentUser.get().getBasicProfile();
    return {
      id: profile.getId(),
      name: profile.getName(),
      email: profile.getEmail(),
      picture: profile.getImageUrl()
    };
  }

  static async createSpreadsheet(title: string): Promise<string> {
    await this.initialize();
    
    try {
      const response = await window.gapi.client.sheets.spreadsheets.create({
        properties: {
          title: title
        },
        sheets: [
          { properties: { title: 'Contacts' } },
          { properties: { title: 'Leads' } },
          { properties: { title: 'Tasks' } },
          { properties: { title: 'Companies' } }
        ]
      });

      const spreadsheetId = response.result.spreadsheetId;
      console.log('Created spreadsheet:', spreadsheetId);
      return spreadsheetId;
    } catch (error) {
      console.error('Failed to create spreadsheet:', error);
      throw new Error('Failed to create Google Sheet');
    }
  }

  static async writeToSheet(spreadsheetId: string, sheetName: string, data: any[][]): Promise<void> {
    await this.initialize();
    
    try {
      const range = `${sheetName}!A1:Z${data.length}`;
      
      await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: range,
        valueInputOption: 'RAW',
        resource: {
          values: data
        }
      });

      console.log(`Data written to ${sheetName} successfully`);
    } catch (error) {
      console.error(`Failed to write to ${sheetName}:`, error);
      throw new Error(`Failed to write data to ${sheetName}`);
    }
  }

  static async readFromSheet(spreadsheetId: string, sheetName: string): Promise<any[][]> {
    await this.initialize();
    
    try {
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: `${sheetName}!A:Z`
      });

      return response.result.values || [];
    } catch (error) {
      console.error(`Failed to read from ${sheetName}:`, error);
      throw new Error(`Failed to read data from ${sheetName}`);
    }
  }
}
