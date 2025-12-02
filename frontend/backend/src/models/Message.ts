import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMessageAttachment {
         url: string;
         publicId: string;
         filename?: string;
         mimeType?: string;
         size?: number;
}

export interface IMessage extends Document {
         chat: Types.ObjectId;
         sender: Types.ObjectId;
         senderRole: 'admin' | 'agent' | 'customer';
         text?: string;
         sentiment?: 'positive' | 'neutral' | 'negative';
         readBy: Types.ObjectId[];
         attachment?: IMessageAttachment;
}

const MessageSchema = new Schema<IMessage>(
         {
                  chat: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
                  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
                  senderRole: { type: String, enum: ['admin', 'agent', 'customer'], required: true },
                  text: { type: String, required: false, default: '' },
                  sentiment: { type: String, enum: ['positive', 'neutral', 'negative'], default: 'neutral' },
                  readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
                  attachment: {
                           url: { type: String },
                           publicId: { type: String },
                           filename: { type: String },
                           mimeType: { type: String },
                           size: { type: Number },
                  },
         },
         { timestamps: true },
);

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
