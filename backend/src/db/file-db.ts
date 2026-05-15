import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface LarkCredentials {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  scope: string;
  createdAt: string;
  updatedAt: string;
}

export interface Database {
  users: User[];
  larkCredentials: LarkCredentials[];
}

const DEFAULT_DB_PATH = path.join(__dirname, '../../data/db.json');

export class FileDatabase {
  private db!: Database;
  private initialized = false;
  private dbPath: string;

  constructor(customPath?: string) {
    this.dbPath = customPath || process.env.DB_PATH || DEFAULT_DB_PATH;
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    const dir = path.dirname(this.dbPath);
    await fs.mkdir(dir, { recursive: true });

    try {
      const data = await fs.readFile(this.dbPath, 'utf-8');
      this.db = JSON.parse(data);
    } catch (error) {
      this.db = {
        users: [],
        larkCredentials: [],
      };
      await this.save();
    }

    this.initialized = true;
  }

  private async save(): Promise<void> {
    await fs.writeFile(this.dbPath, JSON.stringify(this.db, null, 2), 'utf-8');
  }

  // User operations
  async createUser(email: string, passwordHash: string): Promise<User> {
    await this.init();

    const existingUser = this.db.users.find(u => u.email === email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const user: User = {
      id: uuidv4(),
      email,
      passwordHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.db.users.push(user);
    await this.save();

    return user;
  }

  async findUserByEmail(email: string): Promise<User | undefined> {
    await this.init();
    return this.db.users.find(u => u.email === email);
  }

  async findUserById(id: string): Promise<User | undefined> {
    await this.init();
    return this.db.users.find(u => u.id === id);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    await this.init();

    const index = this.db.users.findIndex(u => u.id === id);
    if (index === -1) return undefined;

    this.db.users[index] = {
      ...this.db.users[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await this.save();
    return this.db.users[index];
  }

  // Lark credentials operations
  async saveLarkCredentials(credentials: Omit<LarkCredentials, 'createdAt' | 'updatedAt'>): Promise<LarkCredentials> {
    await this.init();

    const existingIndex = this.db.larkCredentials.findIndex(c => c.userId === credentials.userId);
    const now = new Date().toISOString();

    const newCredentials: LarkCredentials = {
      ...credentials,
      createdAt: existingIndex >= 0 ? this.db.larkCredentials[existingIndex].createdAt : now,
      updatedAt: now,
    };

    if (existingIndex >= 0) {
      this.db.larkCredentials[existingIndex] = newCredentials;
    } else {
      this.db.larkCredentials.push(newCredentials);
    }

    await this.save();
    return newCredentials;
  }

  async getLarkCredentials(userId: string): Promise<LarkCredentials | undefined> {
    await this.init();
    return this.db.larkCredentials.find(c => c.userId === userId);
  }

  async deleteLarkCredentials(userId: string): Promise<boolean> {
    await this.init();

    const index = this.db.larkCredentials.findIndex(c => c.userId === userId);
    if (index === -1) return false;

    this.db.larkCredentials.splice(index, 1);
    await this.save();

    return true;
  }
}

export const db = new FileDatabase();