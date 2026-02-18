import express from 'express';
import { chat, getInsights, getChatHistory } from '../controllers/aiCoachController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.post('/chat', protect, chat);
router.get('/insights', protect, getInsights);
router.get('/history', protect, getChatHistory);
router.get('/history/:sessionId', protect, getChatHistory);

export default router;
