import http from 'http';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import apiRouter from './routes';
import { initSocket } from './services/socketService';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
         cors: {
                  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
                  credentials: true,
         },
});

// Basic middlewares
app.use(helmet());
app.use(cors({
         origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
         credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// Health check
app.get('/health', (_req, res) => {
         res.json({ status: 'ok' });
});

// API routes
app.use('/api', apiRouter);

// Socket.IO with JWT auth
initSocket(io);

const PORT = Number(process.env.PORT) || 5000;
const { MONGO_URI } = process.env;

if (!MONGO_URI) {
         // Fail fast if DB connection string is not configured
         // This avoids accidentally connecting to a hardcoded or insecure default
         // and makes deployments more predictable.
         // eslint-disable-next-line no-console
         console.error('MONGO_URI is not defined in environment variables');
         process.exit(1);
}

async function start() {
         try {
                  await mongoose.connect(MONGO_URI);
                  // eslint-disable-next-line no-console
                  console.log('MongoDB connected');

                  server.listen(PORT, () => {
                           // eslint-disable-next-line no-console
                           console.log(`Backend listening on port ${PORT}`);
                  });
         } catch (err) {
                  // eslint-disable-next-line no-console
                  console.error('Failed to start server', err);
                  process.exit(1);
         }
}

start();
