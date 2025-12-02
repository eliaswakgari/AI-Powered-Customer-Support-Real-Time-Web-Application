import { Request, Response } from 'express';
import { Chat } from '../models/Chat';
import { Message } from '../models/Message';
import { User } from '../models/User';

export const getAnalyticsSummary = async (req: Request, res: Response) => {
         try {
                  const role = req.user?.role;
                  if (!role || (role !== 'admin' && role !== 'agent')) {
                           return res.status(403).json({ message: 'Forbidden' });
                  }

                  // Chats per agent (based on Chat.agents array)
                  const chatsPerAgentAgg = await Chat.aggregate([
                           { $unwind: '$agents' },
                           { $group: { _id: '$agents', count: { $sum: 1 } } },
                  ]);

                  const agentIds = chatsPerAgentAgg.map((c) => c._id);
                  const agents = await User.find({ _id: { $in: agentIds } }).select('name email');
                  const agentsMap = new Map(agents.map((a) => [a._id.toString(), a]));

                  const chatsPerAgent = chatsPerAgentAgg.map((row) => {
                           const user = agentsMap.get(row._id.toString());
                           return {
                                    agentId: row._id,
                                    name: user?.name || 'Unknown',
                                    email: user?.email || '',
                                    count: row.count as number,
                           };
                  });

                  // Average first response time (customer -> agent/admin)
                  const allMessages = await Message.find({}).sort({ chat: 1, createdAt: 1 }).select(
                           'chat senderRole createdAt',
                  );

                  let totalDiffMs = 0;
                  let pairCount = 0;

                  const byChat = new Map<string, typeof allMessages>();
                  for (const msg of allMessages) {
                           const key = msg.chat.toString();
                           if (!byChat.has(key)) byChat.set(key, [] as any);
                           (byChat.get(key) as any).push(msg);
                  }

                  for (const msgs of byChat.values()) {
                           const firstCustomer = msgs.find((m: any) => m.senderRole === 'customer');
                           if (!firstCustomer) continue;
                           const firstAgent = msgs.find(
                                    (m: any) =>
                                             (m.senderRole === 'agent' || m.senderRole === 'admin') &&
                                             m.createdAt > firstCustomer.createdAt,
                           );
                           if (!firstAgent) continue;
                           totalDiffMs += firstAgent.createdAt.getTime() - firstCustomer.createdAt.getTime();
                           pairCount += 1;
                  }

                  const averageFirstResponseTimeMinutes =
                           pairCount > 0 ? totalDiffMs / pairCount / (1000 * 60) : null;

                  // Sentiment trends by day
                  const sentimentAgg = await Message.aggregate([
                           {
                                    $group: {
                                             _id: {
                                                      day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                                                      sentiment: '$sentiment',
                                             },
                                             count: { $sum: 1 },
                                    },
                           },
                           { $sort: { '_id.day': 1 } },
                  ]);

                  const sentimentByDayMap: Record<string, { date: string; positive: number; neutral: number; negative: number }> = {};
                  for (const row of sentimentAgg) {
                           const day = row._id.day as string;
                           const sentiment = (row._id.sentiment || 'neutral') as 'positive' | 'neutral' | 'negative';
                           if (!sentimentByDayMap[day]) {
                                    sentimentByDayMap[day] = { date: day, positive: 0, neutral: 0, negative: 0 };
                           }
                           sentimentByDayMap[day][sentiment] += row.count as number;
                  }
                  const sentimentByDay = Object.values(sentimentByDayMap);

                  // Popular keywords from recent messages
                  const recentMessages = await Message.find({ text: { $ne: '' } })
                           .sort({ createdAt: -1 })
                           .limit(500)
                           .select('text');

                  const stopWords = new Set([
                           'the',
                           'and',
                           'for',
                           'you',
                           'with',
                           'that',
                           'this',
                           'have',
                           'from',
                           'your',
                           'are',
                           'was',
                           'will',
                           'can',
                           'please',
                           'thank',
                           'thanks',
                  ]);

                  const keywordCounts: Record<string, number> = {};
                  for (const msg of recentMessages) {
                           const text = (msg.text || '').toLowerCase();
                           const words = text.split(/\W+/).filter((w) => w.length > 3 && !stopWords.has(w));
                           for (const w of words) {
                                    keywordCounts[w] = (keywordCounts[w] || 0) + 1;
                           }
                  }

                  const topKeywords = Object.entries(keywordCounts)
                           .sort((a, b) => b[1] - a[1])
                           .slice(0, 10)
                           .map(([word, count]) => ({ word, count }));

                  return res.json({
                           chatsPerAgent,
                           averageFirstResponseTimeMinutes,
                           sentimentByDay,
                           topKeywords,
                  });
         } catch (err) {
                  // eslint-disable-next-line no-console
                  console.error('getAnalyticsSummary error:', err);
                  return res.status(500).json({ message: 'Failed to get analytics' });
         }
};
