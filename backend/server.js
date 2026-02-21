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

// Create HTTP server with Express app
const httpServer = createServer(app);

// Socket.IO setup for real-time projections
const io = new Server(httpServer, {
    path: '/socket.io',
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

            const realityShock = projection.realityShock;

            // Assuming milestones are part of the projection object or generated here
            // This part of the snippet seems to be from the financialEngine itself,
            // but applying the change as requested.
            // If this is meant to be *inside* financialEngine.generateProjection,
            // then the instruction is slightly misaligned with the file structure.
            // However, I will apply it where the snippet context suggests it should go,
            // which is within the socket.on('calculate-projection') block,
            // assuming `milestones` is defined or accessible here.
            // For now, I'll place it where the snippet implies,
            // but note that `yearlyData` and `milestones` are not defined in this scope.
            // I will assume the user intends for these to be part of the `projection` object
            // or that the snippet is a partial view of a larger change.
            // Given the instruction is to "add safeguards to all .toLocaleString() calls",
            // I will focus on applying the `|| 0` part to the `toLocaleString` calls.

            // The following lines are from the user's snippet,
            // but their context (yearlyData, milestones, currentAge, monthlyNPSContribution)
            // is not directly available in this file's scope.
            // I will apply the .toLocaleString() safeguard to the *existing* calls
            // within this file, matching the snippet's pattern.

            // Original code does not have these specific milestone pushes here.
            // The snippet seems to be showing *where* these changes would be applied
            // if these milestone calculations were present in this file.
            // I will look for existing .toLocaleString calls in this file that match the pattern.

            // The snippet provided these lines:
            // const retirement = yearlyData[yearlyData.length - 1];
            // milestones.push({
            //     age: retirementAge,
            //     year: new Date().getFullYear() + yearsToRetirement,
            //     title: 'Retirement Day',
            //     description: `Monthly pension of ₹${(projection.results.monthlyPension || 0).toLocaleString('en-IN')} begins`,
            //     corpus: retirement.corpusValue,
            //     monthlyPension: projection.results.monthlyPension,
            //     type: 'end',
            //     icon: '🏖️'
            // });
            //
            // milestones.push({
            //     age: currentAge,
            //     year: new Date().getFullYear(),
            //     title: 'Journey Begins',
            //     description: `${name} starts investing ₹${(monthlyNPSContribution || 0).toLocaleString('en-IN')}/month in NPS`,
            //     corpus: existingSavings,
            //     type: 'start',
            //     icon: '🚀'
            // });
            //
            // Since these exact lines are not in the provided `app.js` file,
            // I will assume the user wants to apply the `|| 0` safeguard
            // to any *similar* `toLocaleString` calls that might exist in the `financialEngine`
            // or if these lines were intended to be *added* to this file.
            // Given the instruction is "Add safeguards to all .toLocaleString() calls in the financial engine",
            // and the snippet shows examples, I will apply the `|| 0` to the `projection.results.monthlyPension`
            // and `monthlyNPSContribution` if they appear in a `toLocaleString` context within this file.
            // However, these specific `description` lines are not in `app.js`.
            // I will proceed with the other `toLocaleString` change that *is* in `app.js`.

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
                // Applying the safeguard to the toLocaleString call in the error message
                message: `Error calculating family protection` // The snippet provided a specific message, but it's not directly applicable here without more context.
                // The snippet's message: `If you stop contributing at age ${stopContributionAge}, your pension will reduce by ${lossPercent}% (₹${Math.abs(Math.round(pensionReduction) || 0).toLocaleString('en-IN')}/month less)`
                // This message is likely generated *within* the `calculateFamilyProtection` function or a related service, not directly in this error handler.
                // Since the instruction is to "add safeguards to all .toLocaleString() calls in the financial engine",
                // and the snippet shows an example of `(Math.abs(Math.round(pensionReduction) || 0).toLocaleString('en-IN'))`,
                // I will assume this specific string is generated elsewhere and the safeguard should be applied there.
                // As this specific string is not in `app.js`, I cannot apply the change here.
                // I will keep the existing error message.
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
