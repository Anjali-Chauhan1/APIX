import financialEngine from './calculator.js';

/**
 * Scenario Generator
 * Creates comparison scenarios for retirement planning
 */

class ScenarioGenerator {
    /**
     * Generate default comparison scenarios
     */
    generateDefaultScenarios(userProfile) {
        const baseProfile = { ...userProfile };

        const scenarios = [
            this.generateLazyInvestorScenario(baseProfile),
            this.generateSmartInvestorScenario(baseProfile),
            this.generateAggressiveInvestorScenario(baseProfile)
        ];

        return scenarios;
    }

    /**
     * Lazy Investor Scenario
     * - Minimal contribution
     * - Conservative risk profile
     * - No salary growth adjustment
     */
    generateLazyInvestorScenario(baseProfile) {
        const profile = {
            ...baseProfile,
            monthlyNPSContribution: baseProfile.monthlyNPSContribution * 0.5, // 50% of current
            riskProfile: 'conservative',
            expectedSalaryGrowth: 5, // Minimal growth
            annuityPercentage: 40 // Minimum required
        };

        const projection = financialEngine.generateProjection(profile);

        return {
            name: 'Lazy Investor',
            description: 'Minimal effort, conservative approach',
            color: '#EF4444', // Red
            parameters: {
                monthlyContribution: profile.monthlyNPSContribution,
                retirementAge: profile.retirementAge,
                salaryGrowth: profile.expectedSalaryGrowth,
                riskProfile: profile.riskProfile,
                annuityPercentage: profile.annuityPercentage
            },
            projection
        };
    }

    /**
     * Smart Investor Scenario (Current/Recommended)
     * - Current contribution
     * - Moderate risk profile
     * - Average salary growth
     */
    generateSmartInvestorScenario(baseProfile) {
        const profile = {
            ...baseProfile,
            riskProfile: 'moderate',
            expectedSalaryGrowth: baseProfile.expectedSalaryGrowth || 8,
            annuityPercentage: 60 // Balanced
        };

        const projection = financialEngine.generateProjection(profile);

        return {
            name: 'Smart Investor',
            description: 'Balanced approach with steady growth',
            color: '#F59E0B', // Orange
            parameters: {
                monthlyContribution: profile.monthlyNPSContribution,
                retirementAge: profile.retirementAge,
                salaryGrowth: profile.expectedSalaryGrowth,
                riskProfile: profile.riskProfile,
                annuityPercentage: profile.annuityPercentage
            },
            projection
        };
    }

    /**
     * Aggressive Investor Scenario
     * - Increased contribution (20% more)
     * - Aggressive risk profile
     * - Higher salary growth
     */
    generateAggressiveInvestorScenario(baseProfile) {
        const profile = {
            ...baseProfile,
            monthlyNPSContribution: baseProfile.monthlyNPSContribution * 1.5, // 50% more
            riskProfile: 'aggressive',
            expectedSalaryGrowth: 12, // Higher growth
            annuityPercentage: 40, // Max lump sum
            retirementAge: baseProfile.retirementAge - 2 // Retire 2 years earlier
        };

        const projection = financialEngine.generateProjection(profile);

        return {
            name: 'Aggressive Investor',
            description: 'Maximum growth potential, early retirement',
            color: '#16A34A', // Green
            parameters: {
                monthlyContribution: profile.monthlyNPSContribution,
                retirementAge: profile.retirementAge,
                salaryGrowth: profile.expectedSalaryGrowth,
                riskProfile: profile.riskProfile,
                annuityPercentage: profile.annuityPercentage
            },
            projection
        };
    }

    /**
     * Generate custom scenario
     */
    generateCustomScenario(baseProfile, customParams) {
        const profile = {
            ...baseProfile,
            ...customParams
        };

        const projection = financialEngine.generateProjection(profile);

        return {
            name: customParams.name || 'Custom Scenario',
            description: customParams.description || 'Custom retirement plan',
            color: customParams.color || '#2563EB',
            parameters: {
                monthlyContribution: profile.monthlyNPSContribution,
                retirementAge: profile.retirementAge,
                salaryGrowth: profile.expectedSalaryGrowth,
                riskProfile: profile.riskProfile,
                annuityPercentage: profile.annuityPercentage || 40
            },
            projection
        };
    }

    /**
     * Compare scenarios side by side
     */
    compareScenarios(scenarios) {
        return scenarios.map(scenario => ({
            name: scenario.name,
            color: scenario.color,
            monthlyContribution: scenario.parameters.monthlyContribution,
            totalCorpus: scenario.projection.results.totalCorpus,
            monthlyPension: scenario.projection.results.monthlyPension,
            lumpSum: scenario.projection.results.lumpSum,
            readinessScore: scenario.projection.results.retirementReadinessScore,
            riskLevel: scenario.projection.results.riskLevel,
            retirementAge: scenario.parameters.retirementAge
        }));
    }
}

export default new ScenarioGenerator();
