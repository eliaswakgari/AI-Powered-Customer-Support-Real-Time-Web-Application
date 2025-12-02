import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../models/User';

const createToken = (id: string, role: UserRole) => {
         const secret = process.env.JWT_SECRET || 'change-me';
         const expiresIn = '7d';
         return jwt.sign({ id, role }, secret, { expiresIn });
};

export const register = async (req: Request, res: Response) => {
         try {
                  const { email, password, name, role } = req.body as {
                           email: string;
                           password: string;
                           name: string;
                           role: UserRole;
                  };

                  const existing = await User.findOne({ email });
                  if (existing) {
                           return res.status(400).json({ message: 'Email already in use' });
                  }

                  const hashed = await bcrypt.hash(password, 10);
                  const user = await User.create({ email, password: hashed, name, role });

                  return res.status(201).json({
                           id: user._id,
                           email: user.email,
                           name: user.name,
                           role: user.role,
                  });
         } catch (err) {
                  console.error(err);
                  return res.status(500).json({ message: 'Registration failed' });
         }
};

export const login = async (req: Request, res: Response) => {
         try {
                  const { email, password } = req.body as { email: string; password: string };

                  const user = await User.findOne({ email });
                  if (!user) {
                           return res.status(400).json({ message: 'Invalid credentials' });
                  }

                  const valid = await bcrypt.compare(password, user.password);
                  if (!valid) {
                           return res.status(400).json({ message: 'Invalid credentials' });
                  }

                  const token = createToken(user._id.toString(), user.role);

                  res
                           .cookie('token', token, {
                                    httpOnly: true,
                                    secure: process.env.NODE_ENV === 'production',
                                    sameSite: 'lax',
                                    maxAge: 7 * 24 * 60 * 60 * 1000,
                           })
                           .json({
                                    id: user._id,
                                    email: user.email,
                                    name: user.name,
                                    role: user.role,
                                    token,
                           });
         } catch (err) {
                  console.error(err);
                  return res.status(500).json({ message: 'Login failed' });
         }
};

export const me = async (req: Request, res: Response) => {
         try {
                  if (!req.user) {
                           return res.status(401).json({ message: 'Not authenticated' });
                  }

                  const user = await User.findById(req.user.id).select('-password');
                  if (!user) {
                           return res.status(404).json({ message: 'User not found' });
                  }

                  return res.json(user);
         } catch (err) {
                  console.error(err);
                  return res.status(500).json({ message: 'Failed to load profile' });
         }
};

export const logout = (req: Request, res: Response) => {
         res.clearCookie('token').json({ message: 'Logged out' });
};
