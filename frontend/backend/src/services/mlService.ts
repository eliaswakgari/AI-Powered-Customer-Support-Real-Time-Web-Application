// Local ML service with heuristic sentiment and static smart replies.

export type SentimentLabel = 'positive' | 'neutral' | 'negative';

export interface SentimentResult {
         label: SentimentLabel;
         score: number;
}

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
         const lowered = text.toLowerCase();
         if (!lowered.trim()) {
                  return { label: 'neutral', score: 0.5 };
         }

         const negativeWords = ['bad', 'terrible', 'angry', 'upset', 'hate', 'awful', 'worst', 'frustrated'];
         const positiveWords = ['great', 'good', 'thanks', 'thank you', 'awesome', 'love', 'excellent'];
         const negHits = negativeWords.filter(w => lowered.includes(w)).length;
         const posHits = positiveWords.filter(w => lowered.includes(w)).length;

         if (negHits > posHits && negHits > 0) {
                  return { label: 'negative', score: 0.8 };
         }
         if (posHits > negHits && posHits > 0) {
                  return { label: 'positive', score: 0.8 };
         }
         return { label: 'neutral', score: 0.5 };
}

export interface SmartReplySuggestion {
         text: string;
}

export async function getSmartReplies(text: string): Promise<SmartReplySuggestion[]> {
         const lowered = text.toLowerCase();
         if (!lowered.trim()) {
                  return [];
         }

         const isNegative = ['bad', 'terrible', 'angry', 'upset', 'hate', 'awful', 'worst', 'frustrated'].some(w =>
                  lowered.includes(w),
         );
         const isPositive = ['great', 'good', 'thanks', 'thank you', 'awesome', 'love', 'excellent'].some(w =>
                  lowered.includes(w),
         );

         if (isNegative) {
                  return [
                           { text: 'I’m really sorry about this experience. Let me fix this for you right away.' },
                           { text: 'I understand your frustration. Could you share a bit more detail so I can help?' },
                           { text: 'Thank you for your patience—I’m checking this now and will update you shortly.' },
                  ];
         }

         if (isPositive) {
                  return [
                           { text: 'Thank you for the kind words! Is there anything else I can help you with?' },
                           { text: 'I’m glad to hear that. I’m here if you need anything else.' },
                           { text: 'Really appreciate your feedback—have a great day!' },
                  ];
         }

         return [
                  { text: 'Thank you for reaching out. Could you please provide a bit more detail?' },
                  { text: 'I understand. Let me check this for you right away.' },
                  { text: 'I’ll look into this and get back to you as soon as possible.' },
         ];
}
