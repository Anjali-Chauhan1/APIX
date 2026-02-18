import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Server } from 'socket.io';
import { createServer } from 'http';

import connectDB from './config/database.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import projectionRoutes from './routes/projectionRoutes.js';
import aiCoachRoutes from './routes/aiCoachRoutes.js';

// Load env vars
dotenv.config();

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
const httpServer = createServer(app);

// Socket.IO setup for real-time projections
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// Routes
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'NPS Retirement Copilot API',
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
            const { default: financialEngine } = await import('./services/financial-engine/calculator.js');

            const projection = financialEngine.generateProjection(data);
            const realityShock = financialEngine.calculateRealityShock(
                data.desiredMonthlyPension || projection.results.monthlyPension,
                data.inflationRate || 6,
                data.retirementAge - data.age
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
            socket.emit('projection-result', {
                success: false,
                message: 'Error calculating projection'
            });
        }
    });

    // Real-time pension simulation with annuity slider
    socket.on('pension-simulate', async (data) => {
        try {
            const { default: financialEngine } = await import('./services/financial-engine/calculator.js');
            const simulation = financialEngine.calculateNPSPensionSimulation(
                data.corpus,
                data.annuityOptions || [40, 50, 60, 70, 80, 90, 100]
            );
            socket.emit('pension-result', {
                success: true,
                data: simulation
            });
        } catch (error) {
            socket.emit('pension-result', {
                success: false,
                message: 'Error simulating pension'
            });
        }
    });

    // Real-time goal planning
    socket.on('goal-planning', async (data) => {
        try {
            const { default: financialEngine } = await import('./services/financial-engine/calculator.js');
            const plan = financialEngine.calculateGoalBasedPlan(data);
            socket.emit('goal-result', {
                success: true,
                data: plan
            });
        } catch (error) {
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
    console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 NPS Retirement Copilot API Server Running       ║
║                                                       ║
║   📡 Port: ${PORT}                                    ║
║   🌍 Environment: ${process.env.NODE_ENV || 'development'}                      ║
║   🔗 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}     ║
║                                                       ║
║   📚 API Documentation:                               ║
║   • Auth: http://localhost:${PORT}/api/auth           ║
║   • Projections: http://localhost:${PORT}/api/projections ║
║   • AI Coach: http://localhost:${PORT}/api/ai-coach   ║
║                                                       ║
║   ⚡ WebSocket: Enabled for real-time updates        ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

export default app;
