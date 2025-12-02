import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth';
import { createOrGetChat, listChatsForUser, listMessages, sendMessage } from '../controllers/chatController';

const router = Router();

const upload = multer({
         dest: 'uploads/',
         limits: { fileSize: 5 * 1024 * 1024 },
         fileFilter: (_req, file, cb) => {
                  const allowedMime = [
                           'image/png',
                           'image/jpeg',
                           'image/jpg',
                           'image/gif',
                           'application/pdf',
                           'application/msword',
                           'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                           'text/plain',
                  ];

                  if (!allowedMime.includes(file.mimetype)) {
                           return cb(new Error('Unsupported file type'));
                  }

                  cb(null, true);
         },
});

router.use(authMiddleware);

// Customer starts or resumes their main chat
router.post('/', createOrGetChat);

// List chats for current user (customer, agent, admin)
router.get('/', listChatsForUser);

// Messages in a specific chat
router.get('/:chatId/messages', listMessages);
router.post('/:chatId/messages', upload.single('attachment'), sendMessage);

export default router;
