import express from 'express';
import {
    generateProjection,
    runMonteCarloSimulation,
    generateScenarios,
    getProjectionHistory,
    getAssumptions,
    goalBasedPlanning,
    familyProtection,
    salarySimulation,
    pensionSimulator,
    retirementTimeline,
    gapDetector,
    realityShockMeter
} from '../controllers/projectionController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.post('/generate', protect, generateProjection);
router.post('/monte-carlo', protect, runMonteCarloSimulation);
router.get('/scenarios', protect, generateScenarios);
router.get('/history', protect, getProjectionHistory);
router.get('/assumptions', getAssumptions);

router.post('/goal-planning', protect, goalBasedPlanning);
router.post('/family-protection', protect, familyProtection);
router.post('/salary-simulation', protect, salarySimulation);
router.post('/pension-simulator', protect, pensionSimulator);
router.post('/timeline', protect, retirementTimeline);
router.post('/gap-detector', protect, gapDetector);
router.post('/reality-shock', protect, realityShockMeter);

export default router;
