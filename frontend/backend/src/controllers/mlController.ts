import { Request, Response } from 'express';
import { analyzeSentiment, getSmartReplies } from '../services/mlService';

export const analyzeSentimentHandler = async (req: Request, res: Response) => {
         try {
                  const { text } = req.body as { text: string };
                  if (!text) {
                           return res.status(400).json({ message: 'Text is required' });
                  }
                  const result = await analyzeSentiment(text);
                  return res.json(result);
         } catch (err) {
                  console.error(err);
                  return res.status(500).json({ message: 'Sentiment analysis failed' });
         }
};

export const smartRepliesHandler = async (req: Request, res: Response) => {
         try {
                  const { text } = req.body as { text: string };
                  if (!text) {
                           return res.status(400).json({ message: 'Text is required' });
                  }
                  const suggestions = await getSmartReplies(text);
                  return res.json(suggestions);
         } catch (err) {
                  console.error(err);
                  return res.status(500).json({ message: 'Smart reply generation failed' });
         }
};
