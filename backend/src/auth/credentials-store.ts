import { FileDatabase, db, LarkCredentials } from '../db/file-db';

export interface SaveCredentialsInput {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  scope?: string;
}

export class CredentialsStore {
  private db: FileDatabase;

  constructor(database?: FileDatabase) {
    this.db = database || db;
  }

  async saveLarkCredentials(input: SaveCredentialsInput): Promise<LarkCredentials> {
    const expiresAt = new Date(Date.now() + input.expiresIn * 1000).toISOString();

    return this.db.saveLarkCredentials({
      userId: input.userId,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      expiresAt,
      scope: input.scope || '',
    });
  }

  async getLarkCredentials(userId: string): Promise<LarkCredentials | undefined> {
    const credentials = await this.db.getLarkCredentials(userId);

    if (!credentials) {
      return undefined;
    }

    if (new Date(credentials.expiresAt) < new Date()) {
      return undefined;
    }

    return credentials;
  }

  async hasLarkCredentials(userId: string): Promise<boolean> {
    const credentials = await this.getLarkCredentials(userId);
    return credentials !== undefined;
  }

  async deleteLarkCredentials(userId: string): Promise<boolean> {
    return this.db.deleteLarkCredentials(userId);
  }

  async getValidAccessToken(userId: string): Promise<string | undefined> {
    const credentials = await this.getLarkCredentials(userId);
    return credentials?.accessToken;
  }
}

export const credentialsStore = new CredentialsStore();