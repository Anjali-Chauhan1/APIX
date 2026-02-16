import Projection from '../models/Projection.js';
import financialEngine from '../services/financial-engine/calculator.js';
import monteCarloEngine from '../services/financial-engine/monteCarlo.js';
import scenarioGenerator from '../services/financial-engine/scenarioGenerator.js';
import mongoose from 'mongoose';


const isDbConnected = () => mongoose.connection.readyState === 1;

export const generateProjection = async (req, res) => {
    try {
        const user = req.user;

        const params = {
            age: req.body.age || user.age || 30,
            retirementAge: req.body.retirementAge || user.retirementAge || 60,
            monthlySalary: req.body.monthlySalary || user.monthlySalary || 50000,
            monthlyNPSContribution: req.body.monthlyNPSContribution || user.monthlyNPSContribution || 5000,
            existingSavings: req.body.existingSavings !== undefined ? req.body.existingSavings : (user.existingSavings || 0),
            riskProfile: req.body.riskProfile || user.riskProfile || 'moderate',
            expectedSalaryGrowth: req.body.expectedSalaryGrowth !== undefined ? req.body.expectedSalaryGrowth : (user.expectedSalaryGrowth || 8),
            desiredMonthlyPension: req.body.desiredMonthlyPension || user.desiredMonthlyPension,
            inflationRate: req.body.inflationRate || 6,
            annuityPercentage: req.body.annuityPercentage || 40,
            name: user.name || 'Investor'
        };

        const projection = financialEngine.generateProjection(params);

        let contributionGap = null;
        if (params.desiredMonthlyPension) {
            contributionGap = financialEngine.calculateContributionGapWithSuggestions({
                currentMonthlyContribution: params.monthlyNPSContribution,
                desiredMonthlyPension: params.desiredMonthlyPension,
                yearsToRetirement: params.retirementAge - params.age,
                riskProfile: params.riskProfile,
                annuityPercentage: params.annuityPercentage,
                currentAge: params.age,
                retirementAge: params.retirementAge,
                existingSavings: params.existingSavings
            });
        }

    
        const realityShock = financialEngine.calculateRealityShock(
            params.desiredMonthlyPension || projection.results.monthlyPension,
            params.inflationRate,
            params.retirementAge - params.age
        );

        const timeline = financialEngine.generateTimelineStory(params);

     
        const pensionSimulation = financialEngine.calculateNPSPensionSimulation(
            projection.results.totalCorpus
        );

       
        let projectionId = 'demo_' + Date.now();
        if (isDbConnected()) {
            const savedProjection = await Projection.create({
                userId: user._id,
                projectionType: 'standard',
                inputs: projection.inputs,
                results: projection.results,
                yearlyBreakdown: projection.yearlyBreakdown
            });
            projectionId = savedProjection._id;
        }

        res.json({
            success: true,
            data: {
                projection,
                contributionGap,
                realityShock,
                timeline,
                pensionSimulation,
                projectionId
            }
        });
    } catch (error) {
        console.error('Generate Projection Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating projection'
        });
    }
};

export const runMonteCarloSimulation = async (req, res) => {
    try {
        const user = req.user;

        const params = {
            monthlyContribution: req.body.monthlyContribution || user.monthlyNPSContribution || 5000,
            yearsToRetirement: (req.body.retirementAge || user.retirementAge || 60) - (user.age || 30),
            riskProfile: req.body.riskProfile || user.riskProfile || 'moderate',
            salaryGrowth: req.body.salaryGrowth !== undefined ? req.body.salaryGrowth : (user.expectedSalaryGrowth || 8),
            existingSavings: req.body.existingSavings !== undefined ? req.body.existingSavings : (user.existingSavings || 0),
            targetCorpus: req.body.targetCorpus
        };

        const numSimulations = req.body.numSimulations || 1000;

     
        const simulationResults = monteCarloEngine.runSimulation(params, numSimulations);

        if (isDbConnected()) {
            await Projection.create({
                userId: user._id,
                projectionType: 'monte-carlo',
                inputs: params,
                results: {
                    ...simulationResults.statistics,
                    retirementReadinessScore: simulationResults.successProbability || 0
                }
            });
        }

        res.json({
            success: true,
            data: simulationResults
        });
    } catch (error) {
        console.error('Monte Carlo Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error running Monte Carlo simulation'
        });
    }
};

export const generateScenarios = async (req, res) => {
    try {
        const user = req.user;

        const userProfile = {
            age: user.age || 30,
            retirementAge: user.retirementAge || 60,
            monthlySalary: user.monthlySalary || 50000,
            monthlyNPSContribution: user.monthlyNPSContribution || 5000,
            existingSavings: user.existingSavings || 0,
            riskProfile: user.riskProfile || 'moderate',
            expectedSalaryGrowth: user.expectedSalaryGrowth || 8,
            desiredMonthlyPension: user.desiredMonthlyPension || 30000
        };

        const scenarios = scenarioGenerator.generateDefaultScenarios(userProfile);

        const comparison = scenarioGenerator.compareScenarios(scenarios);

        res.json({
            success: true,
            data: {
                scenarios,
                comparison
            }
        });
    } catch (error) {
        console.error('Generate Scenarios Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating scenarios'
        });
    }
};

export const getProjectionHistory = async (req, res) => {
    try {
      
        if (!isDbConnected()) {
            return res.json({
                success: true,
                data: []
            });
        }

        const projections = await Projection.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({
            success: true,
            data: projections
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching projection history'
        });
    }
};

export const getAssumptions = async (req, res) => {
    try {
        res.json({
            success: true,
            data: financialEngine.getTransparencyDetails()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching assumptions'
        });
    }
};

export const goalBasedPlanning = async (req, res) => {
    try {
        const user = req.user;

        const params = {
            desiredMonthlyPension: req.body.desiredMonthlyPension || 50000,
            currentAge: req.body.currentAge || user.age || 30,
            retirementAge: req.body.retirementAge || user.retirementAge || 60,
            riskProfile: req.body.riskProfile || user.riskProfile || 'moderate',
            existingSavings: req.body.existingSavings !== undefined ? req.body.existingSavings : (user.existingSavings || 0),
            annuityPercentage: req.body.annuityPercentage || 40,
            inflationRate: req.body.inflationRate || 6
        };

        const plan = financialEngine.calculateGoalBasedPlan(params);

        res.json({
            success: true,
            data: plan
        });
    } catch (error) {
        console.error('Goal Planning Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error calculating goal-based plan'
        });
    }
};

export const familyProtection = async (req, res) => {
    try {
        const user = req.user;

        const params = {
            currentAge: req.body.currentAge || user.age || 30,
            retirementAge: req.body.retirementAge || user.retirementAge || 60,
            monthlySalary: req.body.monthlySalary || user.monthlySalary || 50000,
            monthlyNPSContribution: req.body.monthlyNPSContribution || user.monthlyNPSContribution || 5000,
            existingSavings: req.body.existingSavings !== undefined ? req.body.existingSavings : (user.existingSavings || 0),
            riskProfile: req.body.riskProfile || user.riskProfile || 'moderate',
            expectedSalaryGrowth: req.body.expectedSalaryGrowth || user.expectedSalaryGrowth || 8,
            stopContributionAge: req.body.stopContributionAge || (user.age || 30) + 10,
            annuityPercentage: req.body.annuityPercentage || 40
        };

        const protection = financialEngine.calculateFamilyProtection(params);

        res.json({
            success: true,
            data: protection
        });
    } catch (error) {
        console.error('Family Protection Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error calculating family protection scenario'
        });
    }
};

export const salarySimulation = async (req, res) => {
    try {
        const user = req.user;

        const params = {
            currentAge: req.body.currentAge || user.age || 30,
            retirementAge: req.body.retirementAge || user.retirementAge || 60,
            monthlySalary: req.body.monthlySalary || user.monthlySalary || 50000,
            monthlyNPSContribution: req.body.monthlyNPSContribution || user.monthlyNPSContribution || 5000,
            existingSavings: req.body.existingSavings !== undefined ? req.body.existingSavings : (user.existingSavings || 0),
            riskProfile: req.body.riskProfile || user.riskProfile || 'moderate',
            contributionPercentage: req.body.contributionPercentage || 10
        };

        const simulation = financialEngine.simulateSalaryGrowth(params);

        res.json({
            success: true,
            data: simulation
        });
    } catch (error) {
        console.error('Salary Simulation Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error calculating salary simulation'
        });
    }
};

export const pensionSimulator = async (req, res) => {
    try {
        const user = req.user;

        // First get the corpus
        const params = {
            age: req.body.age || user.age || 30,
            retirementAge: req.body.retirementAge || user.retirementAge || 60,
            monthlySalary: req.body.monthlySalary || user.monthlySalary || 50000,
            monthlyNPSContribution: req.body.monthlyNPSContribution || user.monthlyNPSContribution || 5000,
            existingSavings: req.body.existingSavings !== undefined ? req.body.existingSavings : (user.existingSavings || 0),
            riskProfile: req.body.riskProfile || user.riskProfile || 'moderate',
            expectedSalaryGrowth: req.body.expectedSalaryGrowth || user.expectedSalaryGrowth || 8
        };

        const projection = financialEngine.generateProjection(params);
        const corpus = req.body.corpus || projection.results.totalCorpus;
        
      
        const annuityOptions = req.body.annuityOptions || [40, 50, 60, 70, 80, 90, 100];
        const simulation = financialEngine.calculateNPSPensionSimulation(corpus, annuityOptions);

   
        const selectedPercentage = req.body.annuityPercentage || 40;
        const selectedOption = simulation.find(s => s.annuityPercentage === selectedPercentage) || simulation[0];

        res.json({
            success: true,
            data: {
                corpus,
                selectedOption,
                allOptions: simulation,
                npsRules: {
                    minAnnuity: 40,
                    maxAnnuity: 100,
                    explanation: 'NPS requires minimum 40% of corpus to be used for annuity purchase. The remaining can be withdrawn as lump sum (tax-free up to 60% of corpus).'
                }
            }
        });
    } catch (error) {
        console.error('Pension Simulator Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error running pension simulator'
        });
    }
};

export const retirementTimeline = async (req, res) => {
    try {
        const user = req.user;

        const params = {
            currentAge: req.body.currentAge || user.age || 30,
            retirementAge: req.body.retirementAge || user.retirementAge || 60,
            monthlySalary: req.body.monthlySalary || user.monthlySalary || 50000,
            monthlyNPSContribution: req.body.monthlyNPSContribution || user.monthlyNPSContribution || 5000,
            existingSavings: req.body.existingSavings !== undefined ? req.body.existingSavings : (user.existingSavings || 0),
            riskProfile: req.body.riskProfile || user.riskProfile || 'moderate',
            expectedSalaryGrowth: req.body.expectedSalaryGrowth || user.expectedSalaryGrowth || 8,
            name: user.name || 'Investor',
            age: req.body.currentAge || user.age || 30
        };

        const timeline = financialEngine.generateTimelineStory(params);

        res.json({
            success: true,
            data: timeline
        });
    } catch (error) {
        console.error('Timeline Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating timeline'
        });
    }
};

export const gapDetector = async (req, res) => {
    try {
        const user = req.user;

        const params = {
            currentMonthlyContribution: req.body.monthlyNPSContribution || user.monthlyNPSContribution || 5000,
            desiredMonthlyPension: req.body.desiredMonthlyPension || user.desiredMonthlyPension || 50000,
            yearsToRetirement: (req.body.retirementAge || user.retirementAge || 60) - (req.body.currentAge || user.age || 30),
            riskProfile: req.body.riskProfile || user.riskProfile || 'moderate',
            annuityPercentage: req.body.annuityPercentage || 40,
            currentAge: req.body.currentAge || user.age || 30,
            retirementAge: req.body.retirementAge || user.retirementAge || 60,
            existingSavings: req.body.existingSavings !== undefined ? req.body.existingSavings : (user.existingSavings || 0)
        };

        const gapAnalysis = financialEngine.calculateContributionGapWithSuggestions(params);

        res.json({
            success: true,
            data: gapAnalysis
        });
    } catch (error) {
        console.error('Gap Detector Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error calculating contribution gap'
        });
    }
};

export const realityShockMeter = async (req, res) => {
    try {
        const user = req.user;

        const currentPensionNeed = req.body.currentPensionNeed || req.body.desiredMonthlyPension || 50000;
        const inflationRate = req.body.inflationRate || 6;
        const yearsToRetirement = (req.body.retirementAge || user.retirementAge || 60) - (req.body.currentAge || user.age || 30);

        const shock = financialEngine.calculateRealityShock(currentPensionNeed, inflationRate, yearsToRetirement);

        res.json({
            success: true,
            data: shock
        });
    } catch (error) {
        console.error('Reality Shock Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error calculating reality shock'
        });
    }
};
