import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IChat extends Document {
         customer: Types.ObjectId;
         agents: Types.ObjectId[];
         status: 'open' | 'pending' | 'closed' | 'escalated';
}

const ChatSchema = new Schema<IChat>(
         {
                  customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
                  agents: [{ type: Schema.Types.ObjectId, ref: 'User' }],
                  status: {
                           type: String,
                           enum: ['open', 'pending', 'closed', 'escalated'],
                           default: 'open',
                  },
         },
         { timestamps: true },
);

export const Chat = mongoose.model<IChat>('Chat', ChatSchema);
