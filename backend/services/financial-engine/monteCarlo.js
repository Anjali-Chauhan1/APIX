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
        const {
            initialMonthlyContribution,
            yearsToRetirement,
            meanReturn,
            volatility,
            annualSalaryGrowth,
            existingSavings = 0
        } = params;

        let corpus = existingSavings;
        let currentMonthlyContribution = initialMonthlyContribution;

        for (let year = 1; year <= yearsToRetirement; year++) {
            // Random return for this year
            const yearReturn = this.generateRandomReturn(meanReturn, volatility);

            // Add contributions
            const yearlyContribution = currentMonthlyContribution * 12;
            corpus += yearlyContribution;

            // Apply returns
            corpus *= (1 + yearReturn / 100);

            // Increase contribution for next year
            currentMonthlyContribution *= (1 + annualSalaryGrowth / 100);
        }

        return corpus;
    }

    /**
     * Run Monte Carlo simulation
     */
    runSimulation(params, numSimulations = this.defaultSimulations) {
        const {
            monthlyContribution,
            yearsToRetirement,
            riskProfile,
            salaryGrowth,
            existingSavings
        } = params;

        // Define volatility based on risk profile
        const volatilityMap = {
            conservative: 8,  // 8% standard deviation
            moderate: 12,     // 12% standard deviation
            aggressive: 16    // 16% standard deviation
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
        const p10 = stats.quantile(results, 0.10);  // Worst 10%
        const p25 = stats.quantile(results, 0.25);  // Worst 25%
        const p50 = stats.quantile(results, 0.50);  // Median
        const p75 = stats.quantile(results, 0.75);  // Best 25%
        const p90 = stats.quantile(results, 0.90);  // Best 10%

        // Calculate success probability (if target is provided)
        let successProbability = null;
        if (params.targetCorpus) {
            const successCount = results.filter(r => r >= params.targetCorpus).length;
            successProbability = (successCount / numSimulations) * 100;
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
            successProbability,
            totalSimulations: numSimulations
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
