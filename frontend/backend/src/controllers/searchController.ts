import { Request, Response } from 'express';
import { Chat } from '../models/Chat';
import { Message } from '../models/Message';
import { User } from '../models/User';

export const searchChats = async (req: Request, res: Response) => {
         try {
                  const { q, status, from, to, sentiment, customer, agent } = req.query as {
                           q?: string;
                           status?: string;
                           from?: string;
                           to?: string;
                           sentiment?: string;
                           customer?: string;
                           agent?: string;
                  };

                  const userId = req.user?.id;
                  const role = req.user?.role;
                  if (!userId || !role) {
                           return res.status(401).json({ message: 'Not authenticated' });
                  }

                  const chatFilter: any = {};

                  if (status) {
                           chatFilter.status = status;
                  }

                  if (from || to) {
                           chatFilter.createdAt = {};
                           if (from) chatFilter.createdAt.$gte = new Date(from);
                           if (to) chatFilter.createdAt.$lte = new Date(to);
                  }

                  if (role === 'customer') {
                           chatFilter.customer = userId;
                  }

                  // Optional: filter by customer name
                  if (customer && customer.trim()) {
                           const customerUsers = await User.find({
                                    name: { $regex: customer, $options: 'i' },
                           }).select('_id');
                           const ids = customerUsers.map((u) => u._id);
                           if (ids.length === 0) {
                                    return res.json([]);
                           }
                           chatFilter.customer = { $in: ids };
                  }

                  // Optional: filter by agent name
                  if (agent && agent.trim()) {
                           const agentUsers = await User.find({
                                    name: { $regex: agent, $options: 'i' },
                           }).select('_id');
                           const ids = agentUsers.map((u) => u._id);
                           if (ids.length === 0) {
                                    return res.json([]);
                           }
                           chatFilter.agents = { $in: ids };
                  }

                  // Message-based filters (keyword and sentiment)
                  let allowedChatIds: string[] | null = null;

                  if (q && q.trim()) {
                           const messages = await Message.find({
                                    text: { $regex: q, $options: 'i' },
                           }).select('chat');
                           const chatIds = [...new Set(messages.map((m) => m.chat.toString()))];
                           if (chatIds.length === 0) {
                                    return res.json([]);
                           }
                           allowedChatIds = chatIds;
                  }

                  if (sentiment && sentiment.trim()) {
                           const sentimentMessages = await Message.find({ sentiment }).select('chat');
                           const sentimentChatIds = [
                                    ...new Set(sentimentMessages.map((m) => m.chat.toString())),
                           ];
                           if (allowedChatIds) {
                                    const set = new Set(allowedChatIds);
                                    allowedChatIds = sentimentChatIds.filter((id) => set.has(id));
                           } else {
                                    allowedChatIds = sentimentChatIds;
                           }
                  }

                  if (allowedChatIds) {
                           if (allowedChatIds.length === 0) {
                                    return res.json([]);
                           }
                           chatFilter._id = { $in: allowedChatIds };
                  }

                  const chats = await Chat.find(chatFilter)
                           .sort({ updatedAt: -1 })
                           .populate('customer', 'name email')
                           .populate('agents', 'name email');

                  return res.json(chats);
         } catch (err) {
                  console.error(err);
                  return res.status(500).json({ message: 'Failed to search chats' });
         }
};
