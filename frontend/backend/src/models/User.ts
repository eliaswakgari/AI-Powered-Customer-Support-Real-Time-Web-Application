import mongoose, { Document, Schema } from 'mongoose';

export type UserRole = 'admin' | 'agent' | 'customer';

export interface IUser extends Document {
         email: string;
         password: string;
         name: string;
         role: UserRole;
}

const UserSchema = new Schema<IUser>(
         {
                  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
                  password: { type: String, required: true },
                  name: { type: String, required: true },
                  role: { type: String, enum: ['admin', 'agent', 'customer'], required: true },
         },
         { timestamps: true },
);

export const User = mongoose.model<IUser>('User', UserSchema);
