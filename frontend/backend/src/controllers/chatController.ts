import { Request, Response } from 'express';
import { Chat } from '../models/Chat';
import { Message } from '../models/Message';
import { analyzeSentiment } from '../services/mlService';
import { emitNewMessage } from '../services/socketService';
import { uploadToCloudinary } from '../services/cloudinaryService';

export const createOrGetChat = async (req: Request, res: Response) => {
         try {
                  const userId = req.user?.id;
                  if (!userId) {
                           return res.status(401).json({ message: 'Not authenticated' });
                  }

                  // For now: a customer starts a new chat without specifying agent.
                  // Later, admin/logic can assign agents.
                  let chat = await Chat.findOne({ customer: userId, status: { $in: ['open', 'pending'] } });
                  if (!chat) {
                           chat = await Chat.create({ customer: userId, agents: [], status: 'open' });
                  }

                  return res.json(chat);
         } catch (err) {
                  console.error(err);
                  return res.status(500).json({ message: 'Failed to create or load chat' });
         }
};

export const listChatsForUser = async (req: Request, res: Response) => {
         try {
                  const userId = req.user?.id;
                  const role = req.user?.role;
                  if (!userId || !role) {
                           return res.status(401).json({ message: 'Not authenticated' });
                  }

                  let query: any = {};
                  if (role === 'customer') {
                           query.customer = userId;
                  }
                  // For now, agents and admins can see all chats.
                  // Later we can restrict agents to assigned chats via the `agents` field.

                  const chats = await Chat.find(query).sort({ updatedAt: -1 });
                  return res.json(chats);
         } catch (err) {
                  console.error(err);
                  return res.status(500).json({ message: 'Failed to load chats' });
         }
};

export const listMessages = async (req: Request, res: Response) => {
         try {
                  const { chatId } = req.params;

                  const userId = req.user?.id;
                  const role = req.user?.role;
                  if (!userId || !role) {
                           return res.status(401).json({ message: 'Not authenticated' });
                  }

                  const chat = await Chat.findById(chatId).select('customer agents');
                  if (!chat) {
                           return res.status(404).json({ message: 'Chat not found' });
                  }

                  // RBAC: customers can only read their own chats; agents/admins see all for now.
                  if (role === 'customer' && String(chat.customer) !== String(userId)) {
                           return res.status(403).json({ message: 'Forbidden' });
                  }

                  const messages = await Message.find({ chat: chatId }).sort({ createdAt: 1 });
                  return res.json(messages);
         } catch (err) {
                  console.error(err);
                  return res.status(500).json({ message: 'Failed to load messages' });
         }
};

export const sendMessage = async (req: Request, res: Response) => {
         try {
                  const userId = req.user?.id;
                  const role = req.user?.role;
                  if (!userId || !role) {
                           return res.status(401).json({ message: 'Not authenticated' });
                  }

                  const { chatId } = req.params;
                  const { text } = req.body as { text?: string };

                  if (!text && !req.file) {
                           return res.status(400).json({ message: 'Message text or attachment is required' });
                  }

                  const sentiment = text ? await analyzeSentiment(text) : { label: 'neutral' as const };

                  let attachment;
                  if (req.file) {
                           try {
                                    const uploaded = await uploadToCloudinary(req.file.path, 'ai-support-chat');
                                    attachment = {
                                             url: uploaded.url,
                                             publicId: uploaded.publicId,
                                             filename: req.file.originalname,
                                             mimeType: req.file.mimetype,
                                             size: req.file.size,
                                    };
                           } catch (uploadErr) {
                                    console.error('Cloudinary upload failed:', uploadErr);
                                    return res.status(500).json({ message: 'File upload failed' });
                           }
                  }

                  const message = await Message.create({
                           chat: chatId,
                           sender: userId,
                           senderRole: role,
                           text: text || '',
                           sentiment: sentiment.label,
                           readBy: [userId],
                           attachment,
                  });

                  // Chat updatedAt will bump automatically by message if we later add hooks
                  await Chat.findByIdAndUpdate(chatId, { $set: { updatedAt: new Date() } });

                  emitNewMessage(chatId, message);

                  return res.status(201).json(message);
         } catch (err: any) {
                  console.error('sendMessage error:', err);

                  if (err?.message === 'Unsupported file type') {
                           return res.status(400).json({ message: 'Unsupported file type' });
                  }
                  if (err?.code === 'LIMIT_FILE_SIZE') {
                           return res.status(413).json({ message: 'File too large (max 5MB)' });
                  }

                  return res.status(500).json({ message: 'Failed to send message' });
         }
};
