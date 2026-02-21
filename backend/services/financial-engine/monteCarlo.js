import * as stats from 'simple-statistics';

/**
 * Monte Carlo Simulation Engine
 * Runs probabilistic forecasting for retirement planning
 */

class MonteCarloEngine {
    constructor() {
        this.defaultSimulations = 1000;
    }

    /**
     * Generate random return based on normal distribution
     * Mean: expected return, Standard Deviation: volatility
     */
    generateRandomReturn(meanReturn, volatility) {
        // Box-Muller transform for normal distribution
        const u1 = Math.random();
        const u2 = Math.random();
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

        return meanReturn + (volatility * z0);
    }

    /**
     * Run single simulation path
     */
    runSingleSimulation(params) {
        const initialMonthlyContribution = Number(params.initialMonthlyContribution) || 0;
        const yearsToRetirement = Number(params.yearsToRetirement) || 0;
        const meanReturn = Number(params.meanReturn) || 0;
        const volatility = Number(params.volatility) || 0;
        const annualSalaryGrowth = Number(params.annualSalaryGrowth) || 0;
        const existingSavings = Number(params.existingSavings) || 0;

        let corpus = existingSavings;
        let currentMonthlyContribution = initialMonthlyContribution;

        for (let year = 1; year <= yearsToRetirement; year++) {
            // Random return for this year (Arithmetic Mean to Geometric Mean adjustment)
            const annualMean = meanReturn;
            const annualVol = volatility;

            // Standard financial model: Geometric Mean = Arithmetic Mean - (Volatility^2 / 2)
            // But here we use Arithmetic Mean for simplicity in simulation
            const yearReturn = this.generateRandomReturn(annualMean, annualVol);

            // Add contributions (invested throughout the year)
            const yearlyContribution = currentMonthlyContribution * 12;
            corpus += yearlyContribution;

            // Apply returns (simplified year-end)
            const returnMultiplier = (1 + yearReturn / 100);
            corpus *= Math.max(0, returnMultiplier); // Corpus cannot be negative

            // Increase contribution for next year
            currentMonthlyContribution *= (1 + annualSalaryGrowth / 100);
        }

        return Math.round(corpus);
    }

    /**
     * Run Monte Carlo simulation
     */
    runSimulation(params, numSimulations = this.defaultSimulations) {
        const monthlyContribution = Number(params.monthlyContribution) || 0;
        const yearsToRetirement = Number(params.yearsToRetirement) || 0;
        const riskProfile = (params.riskProfile || 'moderate').toLowerCase();
        const salaryGrowth = Number(params.salaryGrowth) || 0;
        const existingSavings = Number(params.existingSavings) || 0;
        const targetCorpus = Number(params.targetCorpus) || 0;

        // Define volatility based on risk profile
        const volatilityMap = {
            conservative: 8,
            moderate: 12,
            aggressive: 16
        };

        const returnMap = {
            conservative: 7,
            moderate: 8.5,
            aggressive: 10
        };

        const meanReturn = returnMap[riskProfile] || returnMap.moderate;
        const volatility = volatilityMap[riskProfile] || volatilityMap.moderate;

        // Run simulations
        const results = [];
        for (let i = 0; i < numSimulations; i++) {
            const finalCorpus = this.runSingleSimulation({
                initialMonthlyContribution: monthlyContribution,
                yearsToRetirement,
                meanReturn,
                volatility,
                annualSalaryGrowth: salaryGrowth,
                existingSavings
            });
            results.push(finalCorpus);
        }

        // Sort results
        results.sort((a, b) => a - b);

        // Calculate statistics
        const mean = stats.mean(results);
        const median = stats.median(results);
        const stdDev = stats.standardDeviation(results);

        // Percentiles
        const p10 = stats.quantile(results, 0.10);
        const p25 = stats.quantile(results, 0.25);
        const p50 = stats.quantile(results, 0.50);
        const p75 = stats.quantile(results, 0.75);
        const p90 = stats.quantile(results, 0.90);

        // Calculate success probability
        let successProbability = 0;
        if (targetCorpus > 0) {
            const successCount = results.filter(r => r >= targetCorpus).length;
            successProbability = (successCount / results.length) * 100;
        } else {
            successProbability = 100; // Success by default if no target
        }

        return {
            statistics: {
                mean: Math.round(mean),
                median: Math.round(median),
                standardDeviation: Math.round(stdDev),
                min: Math.round(results[0]),
                max: Math.round(results[results.length - 1])
            },
            percentiles: {
                p10: Math.round(p10),
                p25: Math.round(p25),
                p50: Math.round(p50),
                p75: Math.round(p75),
                p90: Math.round(p90)
            },
            scenarios: {
                worstCase: Math.round(p10),
                pessimistic: Math.round(p25),
                expected: Math.round(p50),
                optimistic: Math.round(p75),
                bestCase: Math.round(p90)
            },
            successProbability: Math.min(100, Math.max(0, successProbability)),
            totalSimulations: numSimulations,
            yearsToRetirement,
            targetCorpus
        };
    }

    /**
     * Generate distribution data for visualization
     */
    generateDistributionData(results, bins = 50) {
        const min = Math.min(...results);
        const max = Math.max(...results);
        const binWidth = (max - min) / bins;

        const distribution = [];
        for (let i = 0; i < bins; i++) {
            const binStart = min + (i * binWidth);
            const binEnd = binStart + binWidth;
            const count = results.filter(r => r >= binStart && r < binEnd).length;

            distribution.push({
                range: `${Math.round(binStart / 100000)}L - ${Math.round(binEnd / 100000)}L`,
                count,
                percentage: (count / results.length) * 100
            });
        }

        return distribution;
    }
}

export default new MonteCarloEngine();
