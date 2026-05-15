import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { FileDatabase, db, User } from '../db/file-db';

const DEFAULT_JWT_SECRET = 'moraya-secret-key-change-in-production';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);

export interface AuthResult {
  user: Omit<User, 'passwordHash'>;
  token: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
}

export class UserAuthService {
  private db: FileDatabase;
  private jwtSecret: string;

  constructor(database?: FileDatabase, secret?: string) {
    this.db = database || db;
    this.jwtSecret = secret || process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
  }

  async register(email: string, password: string): Promise<AuthResult> {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    const existingUser = await this.db.findUserByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await this.db.createUser(email, passwordHash);

    const token = this.generateToken(user);

    const { passwordHash: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      token,
    };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const user = await this.db.findUserByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    const token = this.generateToken(user);

    const { passwordHash: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      token,
    };
  }

  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as JwtPayload;
      return payload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  async getUserById(userId: string): Promise<Omit<User, 'passwordHash'> | undefined> {
    const user = await this.db.findUserById(userId);
    if (!user) return undefined;

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  private generateToken(user: User): string {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
    };

    return jwt.sign(payload, this.jwtSecret, { expiresIn: '7d' });
  }
}

export const userAuthService = new UserAuthService();