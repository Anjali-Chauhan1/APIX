import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Server } from 'socket.io';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/database.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';

// Services
import financialEngine from './services/financial-engine/calculator.js';
import monteCarloEngine from './services/financial-engine/monteCarlo.js';
import scenarioGenerator from './services/financial-engine/scenarioGenerator.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import projectionRoutes from './routes/projectionRoutes.js';
import aiCoachRoutes from './routes/aiCoachRoutes.js';

// Load env vars from backend/.env regardless of where node is started
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// Try to connect to database, continue without it in demo mode
let dbConnected = false;
try {
    await connectDB();
    dbConnected = true;
} catch (error) {
    console.log('⚠️  Running in DEMO MODE (no MongoDB)');
    console.log('   Some features may be limited.\n');
}

const app = express();

// Create HTTP server without passing app so Socket.IO can handle /socket.io first
const httpServer = createServer();

// Socket.IO setup for real-time projections (must attach before forwarding other requests)
const io = new Server(httpServer, {
    path: '/socket.io',
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Forward non-Socket.IO requests to Express (so /socket.io is handled by Socket.IO, not 404)
httpServer.on('request', (req, res) => {
    if (req.url && req.url.startsWith('/socket.io')) return;
    app(req, res);
});

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting - Relaxed for development and intensive dashboard usage
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 1000, // Limit each IP to 1000 requests per minute
    message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// Routes
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'PensionSaarthi API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            projections: '/api/projections',
            aiCoach: '/api/ai-coach'
        }
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/projections', projectionRoutes);
app.use('/api/ai-coach', aiCoachRoutes);

// Socket.IO for real-time projection updates
io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id);

    // Handle real-time projection calculation
    socket.on('calculate-projection', async (data) => {
        try {
            if (!data) return;
            console.log('📊 Calculating projection for:', data.name || 'Unknown');

            const projection = financialEngine.generateProjection(data);
            console.log('✅ Projection calculated. Readiness Score:', projection.results.retirementReadinessScore);

            // Recalculate related data based on the new projection
            const realityShock = financialEngine.calculateRealityShock(
                data.desiredMonthlyPension || projection.results.monthlyPension,
                data.inflationRate || 6,
                (data.retirementAge || 60) - (data.age || 30)
            );

            const pensionSimulation = financialEngine.calculateNPSPensionSimulation(
                projection.results.totalCorpus
            );

            socket.emit('projection-result', {
                success: true,
                data: {
                    projection,
                    realityShock,
                    pensionSimulation
                }
            });
        } catch (error) {
            console.error('❌ Socket Projection Error:', error);
            socket.emit('projection-result', {
                success: false,
                message: 'Error calculating projection'
            });
        }
    });

    // Real-time pension simulation with annuity slider
    socket.on('pension-simulate', async (data) => {
        try {
            if (!data || !data.corpus) return;
            const simulation = financialEngine.calculateNPSPensionSimulation(
                data.corpus,
                data.annuityOptions || [40, 50, 60, 70, 80, 90, 100]
            );
            socket.emit('pension-result', {
                success: true,
                data: simulation
            });
        } catch (error) {
            console.error('❌ Socket Pension Simulation Error:', error);
            socket.emit('pension-result', {
                success: false,
                message: 'Error simulating pension'
            });
        }
    });

    // Real-time goal planning
    socket.on('goal-planning', async (data) => {
        try {
            if (!data) return;
            const plan = financialEngine.calculateGoalBasedPlan(data);
            socket.emit('goal-result', {
                success: true,
                data: plan
            });
        } catch (error) {
            console.error('❌ Socket Goal Planning Error:', error);
            socket.emit('goal-result', {
                success: false,
                message: 'Error calculating goal'
            });
        }
    });

    // Real-time family protection simulation
    socket.on('family-protection', async (data) => {
        try {
            const { default: financialEngine } = await import('./services/financial-engine/calculator.js');
            const protection = financialEngine.calculateFamilyProtection(data);
            socket.emit('family-protection-result', {
                success: true,
                data: protection
            });
        } catch (error) {
            socket.emit('family-protection-result', {
                success: false,
                message: 'Error calculating family protection'
            });
        }
    });

    // Real-time Monte Carlo simulation
    socket.on('monte-carlo', async (data) => {
        try {
            const { default: monteCarloEngine } = await import('./services/financial-engine/monteCarlo.js');
            const results = monteCarloEngine.runSimulation(data, data.numSimulations || 1000);
            socket.emit('monte-carlo-result', {
                success: true,
                data: results
            });
        } catch (error) {
            socket.emit('monte-carlo-result', {
                success: false,
                message: 'Error running Monte Carlo simulation'
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
    });
});

// Error handlers
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    console.log('🚀 PensionSaarthi API Server Running');
});

export default app;
