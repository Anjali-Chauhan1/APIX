import * as math from 'mathjs';

class FinancialEngine {
    constructor() {
        // Default assumptions (shown in transparency panel)
        this.assumptions = {
            inflation: {
                default: 6.0,
                range: [4, 8]
            },
            returns: {
                conservative: { equity: 8, debt: 6.5, weighted: 7.0 },
                moderate: { equity: 10, debt: 6.5, weighted: 8.5 },
                aggressive: { equity: 12, debt: 6.5, weighted: 10.0 }
            },
            annuityRate: {
                default: 6.5,
                range: [6, 7.5]
            },
            npsRules: {
                minAnnuityPercentage: 40,
                maxAnnuityPercentage: 100
            }
        };
    }

    /**
     * Calculate Future Value of SIP (Systematic Investment Plan)
     * Formula: FV = P × [((1 + r)^n - 1) / r] × (1 + r)
     */
    calculateSIPFutureValue(monthlyContribution, annualReturnRate, years) {
        const monthlyRate = annualReturnRate / 100 / 12;
        const months = years * 12;

        if (monthlyRate === 0) {
            return monthlyContribution * months;
        }

        const futureValue = monthlyContribution *
            (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));

        return futureValue;
    }

    /**
     * Calculate compound growth with increasing contributions (salary growth)
     * This accounts for annual salary increases
     */
    calculateGrowingContributions(params) {
        const {
            initialMonthlyContribution,
            yearsToRetirement,
            annualReturnRate,
            annualSalaryGrowth,
            existingSavings = 0
        } = params;

        let totalCorpus = existingSavings;
        let yearlyBreakdown = [];
        let currentMonthlyContribution = initialMonthlyContribution;
        let totalContributions = existingSavings;

        for (let year = 1; year <= yearsToRetirement; year++) {
            // Calculate this year's contributions
            const yearlyContribution = currentMonthlyContribution * 12;

            // Add contributions to corpus
            totalCorpus += yearlyContribution;
            totalContributions += yearlyContribution;

            // Apply returns
            const returns = totalCorpus * (annualReturnRate / 100);
            totalCorpus += returns;

            yearlyBreakdown.push({
                year,
                contribution: yearlyContribution,
                corpusValue: Math.round(totalCorpus),
                returns: Math.round(returns)
            });

            // Increase contribution for next year based on salary growth
            currentMonthlyContribution *= (1 + annualSalaryGrowth / 100);
        }

        return {
            totalCorpus: Math.round(totalCorpus),
            totalContributions: Math.round(totalContributions),
            totalReturns: Math.round(totalCorpus - totalContributions),
            yearlyBreakdown
        };
    }

    /**
     * Calculate inflation-adjusted value
     */
    calculateInflationAdjustedValue(futureValue, inflationRate, years) {
        const inflationAdjusted = futureValue / Math.pow(1 + inflationRate / 100, years);
        return Math.round(inflationAdjusted);
    }

    /**
     * Calculate monthly pension from annuity
     * Formula: Monthly Pension = corpus × (annuityRate / 100) / 12
     * annuityRate is stored as 6.5 (percentage), converted to decimal 0.065 here
     * Correct: corpus * 0.065 / 12  ✓
     * Wrong:   corpus * 0.065 / 12 / 12  ✗  (double division)
     * Wrong:   corpus * 0.0065 / 12  ✗  (rate already decimal, divided again)
     */
    calculateMonthlyPension(corpus, annualAnnuityRate = 6.5) {
        // annuityRate arrives as 6.5 (%), so divide by 100 once to get 0.065, then /12 for monthly
        const annuityRateDecimal = annualAnnuityRate / 100; // 6.5 → 0.065
        const monthlyPension = (corpus * annuityRateDecimal) / 12;
        return Math.round(monthlyPension);
    }

    /**
     * Calculate NPS corpus breakdown
     * NPS requires minimum 40% annuity purchase
     */
    calculateNPSBreakdown(totalCorpus, annuityPercentage = 40) {
        // Ensure annuity percentage is within NPS rules
        const validPercentage = Math.max(
            this.assumptions.npsRules.minAnnuityPercentage,
            Math.min(annuityPercentage, this.assumptions.npsRules.maxAnnuityPercentage)
        );

        const annuityAmount = totalCorpus * (validPercentage / 100);
        const lumpSum = totalCorpus - annuityAmount;

        // Calculate pension on the intended annuity amount
        const monthlyPension = this.calculateMonthlyPension(annuityAmount, this.assumptions.annuityRate.default);

        return {
            totalCorpus: Math.round(totalCorpus),
            annuityAmount: Math.round(annuityAmount),
            lumpSum: Math.round(lumpSum),
            monthlyPension,
            annuityPercentage: validPercentage
        };
    }

    /**
     * Calculate retirement readiness score
     * Compares predicted corpus with inflation-adjusted required corpus for desired lifestyle
     */
    calculateReadinessScore(params) {
        const {
            predictedCorpus,
            desiredMonthlyPension,
            annuityRate = 6.5,
            inflationRate = 6.0,
            yearsToRetirement = 0,
            annuityPercentage = 40
        } = params;

        // Use a default pension goal if none provided
        const targetPensionCurrent = desiredMonthlyPension || 50000;

        // 1. Inflation-adjust the pension goal to maintain purchasing power at retirement
        const targetPensionFuture = targetPensionCurrent * Math.pow(1 + (inflationRate / 100), yearsToRetirement);

        // 2. Calculate required corpus to generate THIS future pension
        // Pension = Corpus * (Annuity% / 100) * (AnnuityRate / 100) / 12
        // RequiredCorpus = (Pension * 12) / (AnnuityRate / 100) / (Annuity% / 100)
        const annuityFactor = (annuityPercentage / 100) * (annuityRate / 100);
        const requiredCorpus = (targetPensionFuture * 12) / annuityFactor;

        if (requiredCorpus <= 0) return 100;

        // 3. Calculate readiness score
        const score = Math.min((predictedCorpus / requiredCorpus) * 100, 100);

        return Math.round(score) || 0;
    }

    /**
     * Determine risk level based on readiness score
     */
    getRiskLevel(readinessScore) {
        const score = Math.round(readinessScore || 0);

        // High Risk: 0% to 39%
        if (score < 40) return 'high';

        // Moderate Risk: 40% to 75%
        if (score >= 40 && score <= 75) return 'moderate';

        // Low Risk: 76% to 100%
        if (score > 75) return 'low';

        return 'low'; // Default fallback
    }

    /**
     * Get expected return rate based on risk profile
     */
    getExpectedReturn(riskProfile) {
        return this.assumptions.returns[riskProfile]?.weighted ||
            this.assumptions.returns.moderate.weighted;
    }

    /**
     * Calculate inflation-aware contribution gap to reach goal
     */
    calculateContributionGap(params) {
        const {
            currentMonthlyContribution,
            desiredMonthlyPension,
            yearsToRetirement,
            riskProfile,
            annuityPercentage = 40,
            inflationRate = 6
        } = params;

        // Inflation-adjust the desired pension
        const inflationAdjustedPension = desiredMonthlyPension * Math.pow(1 + inflationRate / 100, yearsToRetirement);

        // Calculate required corpus for inflation-adjusted pension
        const annuityRate = this.assumptions.annuityRate.default;
        const requiredAnnuityAmount = (inflationAdjustedPension * 12) / (annuityRate / 100);
        const requiredTotalCorpus = requiredAnnuityAmount / (annuityPercentage / 100);

        // Calculate what monthly contribution is needed
        const expectedReturn = this.getExpectedReturn(riskProfile);
        const monthlyRate = expectedReturn / 100 / 12;
        const months = yearsToRetirement * 12;

        let requiredMonthlyContribution;
        if (monthlyRate === 0) {
            requiredMonthlyContribution = requiredTotalCorpus / months;
        } else {
            requiredMonthlyContribution = requiredTotalCorpus /
                (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
        }

        const gap = requiredMonthlyContribution - currentMonthlyContribution;

        return {
            requiredMonthlyContribution: Math.round(requiredMonthlyContribution),
            currentMonthlyContribution: Math.round(currentMonthlyContribution),
            gap: Math.round(Math.max(0, gap)),
            requiredTotalCorpus: Math.round(requiredTotalCorpus),
            inflationAdjustedPension: Math.round(inflationAdjustedPension)
        };
    }

    /**
     * Generate complete retirement projection
     * This is the main function that ties everything together
     */
    generateProjection(userProfile) {
        const {
            age,
            currentAge,
            retirementAge,
            monthlySalary,
            monthlyNPSContribution,
            existingSavings = 0,
            riskProfile,
            expectedSalaryGrowth = 8,
            desiredMonthlyPension,
            inflationRate = this.assumptions.inflation.default,
            annuityPercentage = 40
        } = userProfile;

        const effectiveAge = parseInt(age || currentAge || 30);
        const effectiveRetirementAge = parseInt(retirementAge || 60);
        const yearsToRetirement = Math.max(0, effectiveRetirementAge - effectiveAge);
        const expectedReturn = this.getExpectedReturn(riskProfile);

        // Calculate corpus with growing contributions
        const corpusData = this.calculateGrowingContributions({
            initialMonthlyContribution: monthlyNPSContribution,
            yearsToRetirement,
            annualReturnRate: expectedReturn,
            annualSalaryGrowth: expectedSalaryGrowth,
            existingSavings
        });

        // Calculate NPS breakdown
        const npsBreakdown = this.calculateNPSBreakdown(
            corpusData.totalCorpus,
            annuityPercentage
        );

        // Calculate inflation-adjusted values
        const inflationAdjustedCorpus = this.calculateInflationAdjustedValue(
            corpusData.totalCorpus,
            inflationRate,
            yearsToRetirement
        );

        // 2. Calculate Readiness Score (Holistic & Inflation-Aware)
        const readinessScore = this.calculateReadinessScore({
            predictedCorpus: corpusData.totalCorpus,
            desiredMonthlyPension,
            annuityRate: this.assumptions.annuityRate.default,
            inflationRate,
            yearsToRetirement,
            annuityPercentage
        });

        // 3. Determine Unified risk level (Source of Truth)
        // Primary driver is readiness score - strictly follow the 40/70 thresholds
        const unifiedRisk = this.getRiskLevel(readinessScore);

        // 4. Calculate Reality Shock (how much inflation hurts)
        const realityShock = this.calculateRealityShock(
            desiredMonthlyPension || npsBreakdown.monthlyPension,
            inflationRate,
            yearsToRetirement,
            readinessScore
        );

        // The risk message and color are now tied directly to the readiness score
        realityShock.riskLevel = unifiedRisk;
        realityShock.riskColor = unifiedRisk === 'high' ? '#DC2626' : (unifiedRisk === 'moderate' ? '#F59E0B' : '#16A34A');

        // Add age to yearly breakdown
        const yearlyBreakdown = corpusData.yearlyBreakdown.map((item, index) => ({
            ...item,
            age: effectiveAge + index + 1
        }));

        return {
            inputs: {
                currentAge: effectiveAge,
                retirementAge: effectiveRetirementAge,
                monthlySalary,
                monthlyContribution: monthlyNPSContribution,
                existingSavings,
                salaryGrowth: expectedSalaryGrowth,
                inflationRate,
                expectedReturn,
                annuityPercentage
            },
            results: {
                totalCorpus: corpusData.totalCorpus,
                inflationAdjustedCorpus,
                annuityAmount: npsBreakdown.annuityAmount,
                monthlyPension: npsBreakdown.monthlyPension,
                lumpSum: npsBreakdown.lumpSum,
                retirementReadinessScore: readinessScore,
                yearsToRetirement,
                totalContributions: corpusData.totalContributions,
                totalReturns: corpusData.totalReturns,
                riskLevel: unifiedRisk
            },
            realityShock,
            yearlyBreakdown
        };
    }

    /**
     * Calculate reality shock - inflation adjusted pension need
     */
    calculateRealityShock(currentPensionNeed, inflationRate, yearsToRetirement, readinessScore) {
        if (!currentPensionNeed) {
            return {
                currentNeed: 0,
                futureNeed: 0,
                multiplier: 1,
                riskLevel: 'low',
                riskColor: '#16A34A',
                message: 'Set a desired pension to see inflation impact'
            };
        }
        const futureValue = currentPensionNeed * Math.pow(1 + inflationRate / 100, yearsToRetirement);

        // Determine multiplier
        const multiplier = futureValue / currentPensionNeed;

        // Multiplier risk is now handled by readiness score in generateProjection
        const riskLevel = 'low';

        // Set risk color based on default (will be overridden by generateProjection)
        const riskColor = '#16A34A';

        return {
            currentNeed: Math.round(currentPensionNeed || 0),
            futureNeed: Math.round(futureValue || 0),
            multiplier: multiplier.toFixed(2),
            riskLevel,
            riskColor,
            message: `₹${(currentPensionNeed || 0).toLocaleString('en-IN')} today = ₹${Math.round(futureValue || 0).toLocaleString('en-IN')} in ${yearsToRetirement || 0} years`
        };
    }

    /**
     * Goal-Based Reverse Planning
     * Calculate what's needed to achieve desired pension
     */
    calculateGoalBasedPlan(params) {
        const {
            desiredMonthlyPension,
            currentAge,
            retirementAge,
            riskProfile,
            existingSavings = 0,
            annuityPercentage = 40,
            inflationRate = 6
        } = params;

        const yearsToRetirement = Math.max(0, retirementAge - currentAge);
        const annuityRate = this.assumptions.annuityRate.default;
        const expectedReturn = this.getExpectedReturn(riskProfile);

        // Inflation-adjust the desired pension
        const inflationAdjustedPension = desiredMonthlyPension * Math.pow(1 + inflationRate / 100, yearsToRetirement);

        // Calculate required corpus for inflation-adjusted pension
        const requiredAnnuityAmount = (inflationAdjustedPension * 12) / (annuityRate / 100);
        const requiredTotalCorpus = requiredAnnuityAmount / (annuityPercentage / 100);

        // Account for existing savings growth
        const futureExistingSavings = existingSavings * Math.pow(1 + expectedReturn / 100, yearsToRetirement);
        const corpusGap = requiredTotalCorpus - futureExistingSavings;

        // Calculate required monthly contribution
        const monthlyRate = expectedReturn / 100 / 12;
        const months = yearsToRetirement * 12;

        let requiredMonthlyContribution;
        if (monthlyRate === 0 || corpusGap <= 0) {
            requiredMonthlyContribution = Math.max(0, corpusGap / months);
        } else {
            requiredMonthlyContribution = corpusGap /
                (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
        }

        // Generate yearly plan for the UI chart
        let yearlyPlan = [];
        let currentCorpus = existingSavings;
        let totalContributed = existingSavings;
        const monthlyContrib = Math.round(Math.max(0, requiredMonthlyContribution));

        for (let year = 1; year <= yearsToRetirement; year++) {
            const yearlyContribution = monthlyContrib * 12;
            currentCorpus += yearlyContribution;
            totalContributed += yearlyContribution;

            // Apply returns
            currentCorpus *= (1 + expectedReturn / 100);

            yearlyPlan.push({
                year: year,
                age: currentAge + year,
                corpus: Math.round(currentCorpus),
                totalContributed: Math.round(totalContributed)
            });
        }

        return {
            desiredMonthlyPension,
            inflationAdjustedPension: Math.round(inflationAdjustedPension),
            targetCorpus: Math.round(requiredTotalCorpus),
            requiredCorpus: Math.round(requiredTotalCorpus),
            futureExistingSavings: Math.round(futureExistingSavings),
            corpusGap: Math.round(Math.max(0, corpusGap)),
            requiredMonthlyContribution: monthlyContrib,
            yearsToRetirement,
            expectedReturn,
            totalContributions: Math.round(totalContributed),
            totalReturns: Math.round(currentCorpus - totalContributed),
            yearlyPlan,
            assumptions: {
                inflationRate,
                expectedReturn,
                annuityRate,
                annuityPercentage
            }
        };
    }

    /**
     * Family Protection Mode - What if contributions stop
     */
    calculateFamilyProtection(params) {
        const {
            currentAge,
            retirementAge,
            existingSavings,
            currentCorpus = existingSavings,
            riskProfile,
            stopContributionAge,
            annuityPercentage = 40
        } = params;

        const expectedReturn = this.getExpectedReturn(riskProfile);

        // Calculate corpus if contributions continue normally
        // IMPORTANT: generateProjection expects `age`, but family-protection params use `currentAge`.
        // Pass age explicitly so yearsToRetirement is computed correctly.
        const normalProjection = this.generateProjection({
            ...params,
            age: params.age || currentAge  // ensure `age` is always set
        });

        // Calculate corpus if contributions stop at specified age
        const yearsOfContributing = stopContributionAge - currentAge;
        const yearsWithoutContribution = retirementAge - stopContributionAge;

        // Corpus at stop point
        const earlyStopGrowth = this.calculateGrowingContributions({
            initialMonthlyContribution: params.monthlyNPSContribution,
            yearsToRetirement: yearsOfContributing,
            annualReturnRate: expectedReturn,
            annualSalaryGrowth: params.expectedSalaryGrowth || 8,
            existingSavings: existingSavings || 0
        });

        // Grow the stopped corpus for remaining years (no more contributions, just compound growth)
        const stoppedCorpus = earlyStopGrowth.totalCorpus *
            Math.pow(1 + expectedReturn / 100, yearsWithoutContribution);

        const normalNPSBreakdown = this.calculateNPSBreakdown(normalProjection.results.totalCorpus, annuityPercentage);
        const stoppedNPSBreakdown = this.calculateNPSBreakdown(stoppedCorpus, annuityPercentage);

        const normalCorpus = normalProjection.results.totalCorpus;
        const normalPension = normalNPSBreakdown.monthlyPension;
        const stoppedPension = stoppedNPSBreakdown.monthlyPension;

        // Bug 3 Fix — Loss% must divide by normalPension, not stoppedPension
        // Correct:  ((normalPension - stoppedPension) / normalPension) * 100
        // Wrong:    ((normalPension - stoppedPension) / stoppedPension) * 100  ✗
        const reductionPercent = normalCorpus > 0
            ? ((normalCorpus - stoppedCorpus) / normalCorpus * 100).toFixed(1)
            : 0;

        const lossPercent = normalPension > 0
            ? (((normalPension - stoppedPension) / normalPension) * 100).toFixed(1)
            : 0;

        const pensionReduction = normalPension - stoppedPension;

        return {
            normalScenario: {
                corpus: normalCorpus,
                monthlyPension: normalPension
            },
            stoppedScenario: {
                stopAge: stopContributionAge,
                corpus: Math.round(stoppedCorpus),
                monthlyPension: stoppedPension,
                lumpSum: stoppedNPSBreakdown.lumpSum
            },
            impact: {
                corpusReduction: Math.round(normalCorpus - stoppedCorpus),
                pensionReduction: Math.round(pensionReduction),
                reductionPercent,
                lossPercent  // pension loss percentage using correct formula
            },
            message: `If you stop contributing at age ${stopContributionAge}, your pension will reduce by ${lossPercent}% (₹${Math.abs(Math.round(pensionReduction)).toLocaleString('en-IN')}/month less)`
        };
    }

    /**
     * Salary Growth Simulation with different profiles
     */
    simulateSalaryGrowth(params) {
        const {
            currentAge,
            retirementAge,
            monthlySalary,
            monthlyNPSContribution,
            existingSavings = 0,
            riskProfile,
            contributionPercentage = 10 // % of salary contributed to NPS
        } = params;

        const profiles = {
            slow: {
                name: 'Slow Growth',
                description: 'Government/PSU career',
                annualGrowth: 5,
                color: '#6B7280'
            },
            average: {
                name: 'Average Growth',
                description: 'Private sector stable',
                annualGrowth: 8,
                color: '#F59E0B'
            },
            fast: {
                name: 'Fast Growth',
                description: 'Tech/High-growth career',
                annualGrowth: 12,
                color: '#16A34A'
            },
            aggressive: {
                name: 'Aggressive Growth',
                description: 'Startup/Entrepreneurial',
                annualGrowth: 18,
                color: '#2563EB'
            }
        };

        const results = {};
        const expectedReturn = this.getExpectedReturn(riskProfile);

        Object.keys(profiles).forEach(key => {
            const profile = profiles[key];
            const yearsToRetirement = retirementAge - currentAge;

            // Calculate with auto-increasing contributions
            let totalCorpus = existingSavings;
            let currentSalary = monthlySalary;
            let currentContribution = monthlyNPSContribution;
            let yearlyData = [];

            for (let year = 1; year <= yearsToRetirement; year++) {
                // Add yearly contributions
                totalCorpus += currentContribution * 12;

                // Apply returns
                totalCorpus *= (1 + expectedReturn / 100);

                yearlyData.push({
                    year,
                    age: currentAge + year,
                    salary: Math.round(currentSalary),
                    contribution: Math.round(currentContribution),
                    corpus: Math.round(totalCorpus)
                });

                // Increase salary and contribution for next year
                currentSalary *= (1 + profile.annualGrowth / 100);
                currentContribution = currentSalary * (contributionPercentage / 100);
            }

            const npsBreakdown = this.calculateNPSBreakdown(totalCorpus, 40);

            results[key] = {
                ...profile,
                finalCorpus: Math.round(totalCorpus),
                monthlyPension: npsBreakdown.monthlyPension,
                finalSalary: Math.round(currentSalary),
                yearlyData
            };
        });

        return results;
    }

    /**
     * Generate Retirement Timeline Story
     */
    generateTimelineStory(params) {
        const {
            currentAge,
            retirementAge,
            monthlyNPSContribution,
            existingSavings,
            riskProfile,
            expectedSalaryGrowth,
            monthlySalary,
            name = 'Investor'
        } = params;

        const expectedReturn = this.getExpectedReturn(riskProfile);
        const yearsToRetirement = retirementAge - currentAge;

        // Generate projection
        const projection = this.generateProjection(params);

        // Create milestones
        const milestones = [];
        const yearlyData = projection.yearlyBreakdown;

        // Current milestone
        milestones.push({
            age: currentAge,
            year: new Date().getFullYear(),
            title: 'Journey Begins',
            description: `${name} starts investing ₹${monthlyNPSContribution.toLocaleString('en-IN')}/month in NPS`,
            corpus: existingSavings,
            type: 'start',
            icon: '🚀'
        });

        // First major milestone (₹10L)
        const firstMajor = yearlyData.find(y => y.corpusValue >= 1000000);
        if (firstMajor) {
            milestones.push({
                age: firstMajor.age,
                year: new Date().getFullYear() + (firstMajor.age - currentAge),
                title: 'First ₹10 Lakh',
                description: 'Corpus crosses 10 lakh milestone',
                corpus: firstMajor.corpusValue,
                type: 'milestone',
                icon: '🎯'
            });
        }

        // Mid-point milestone
        const midPoint = yearlyData[Math.floor(yearsToRetirement / 2)];
        if (midPoint && !milestones.find(m => m.age === midPoint.age)) {
            milestones.push({
                age: midPoint.age,
                year: new Date().getFullYear() + (midPoint.age - currentAge),
                title: 'Halfway There',
                description: `${yearsToRetirement - (midPoint.age - currentAge)} years to retirement`,
                corpus: midPoint.corpusValue,
                type: 'progress',
                icon: '⏳'
            });
        }

        // Crore milestone
        const croreMilestone = yearlyData.find(y => y.corpusValue >= 10000000);
        if (croreMilestone && !milestones.find(m => m.age === croreMilestone.age)) {
            milestones.push({
                age: croreMilestone.age,
                year: new Date().getFullYear() + (croreMilestone.age - currentAge),
                title: 'First ₹1 Crore',
                description: 'Corpus crosses 1 crore - wealth building acceleration',
                corpus: croreMilestone.corpusValue,
                type: 'milestone',
                icon: '🏆'
            });
        }

        // Pre-retirement milestone (5 years before)
        if (yearsToRetirement > 5) {
            const preRetirement = yearlyData[yearsToRetirement - 5];
            if (preRetirement && !milestones.find(m => m.age === preRetirement.age)) {
                milestones.push({
                    age: preRetirement.age,
                    year: new Date().getFullYear() + (preRetirement.age - currentAge),
                    title: '5 Years to Go',
                    description: 'Final countdown begins - consider reducing equity exposure',
                    corpus: preRetirement.corpusValue,
                    type: 'warning',
                    icon: '⚠️'
                });
            }
        }

        // Retirement milestone
        const retirement = yearlyData[yearlyData.length - 1];
        milestones.push({
            age: retirementAge,
            year: new Date().getFullYear() + yearsToRetirement,
            title: 'Retirement Day',
            description: `Monthly pension of ₹${projection.results.monthlyPension.toLocaleString('en-IN')} begins`,
            corpus: retirement.corpusValue,
            monthlyPension: projection.results.monthlyPension,
            type: 'end',
            icon: '🏖️'
        });

        // Sort by age
        milestones.sort((a, b) => a.age - b.age);

        return {
            milestones,
            summary: {
                startAge: currentAge,
                retirementAge,
                totalYears: yearsToRetirement,
                finalCorpus: projection.results.totalCorpus,
                monthlyPension: projection.results.monthlyPension
            }
        };
    }

    /**
     * Calculate NPS pension with different annuity options
     */
    calculateNPSPensionSimulation(corpus, annuityRates = [40, 50, 60, 70, 80, 90, 100]) {
        const results = [];
        const annuityReturnRate = this.assumptions.annuityRate.default;

        annuityRates.forEach(percentage => {
            const annuityAmount = corpus * (percentage / 100);
            const lumpSum = corpus - annuityAmount;
            const monthlyPension = this.calculateMonthlyPension(annuityAmount, annuityReturnRate);

            results.push({
                annuityPercentage: percentage,
                annuityAmount: Math.round(annuityAmount),
                lumpSum: Math.round(lumpSum),
                monthlyPension,
                yearlyPension: monthlyPension * 12,
                description: this.getAnnuityDescription(percentage)
            });
        });

        return results;
    }

    getAnnuityDescription(percentage) {
        if (percentage <= 40) return 'Minimum annuity - Maximum lump sum withdrawal';
        if (percentage <= 60) return 'Balanced approach - Good pension with decent lump sum';
        if (percentage <= 80) return 'Pension focused - Higher monthly income';
        return 'Full annuity - Maximum monthly pension, no lump sum';
    }

    /**
     * Get all assumptions for transparency panel
     */
    getTransparencyDetails() {
        return {
            assumptions: this.assumptions,
            methodology: {
                corpusCalculation: 'Compound interest with growing contributions based on salary growth',
                pensionCalculation: 'Annuity-based using current market annuity rates',
                riskModel: 'Risk profile determines asset allocation and expected returns',
                inflationImpact: 'Future values adjusted for projected inflation rate'
            },
            dataSource: {
                annuityRates: 'Based on current LIC/Insurance company annuity rates',
                returnRates: 'Historical NPS fund performance adjusted for risk profile',
                inflationRate: 'RBI inflation targeting and historical CPI data'
            },
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Calculate contribution gap with smart suggestions
     */
    calculateContributionGapWithSuggestions(params) {
        const {
            currentMonthlyContribution,
            desiredMonthlyPension,
            yearsToRetirement,
            riskProfile,
            annuityPercentage = 40,
            currentAge,
            retirementAge
        } = params;

        const basicGap = this.calculateContributionGap(params);

        // Generate smart suggestions
        const suggestions = [];

        // Suggestion 1: Increase SIP
        if (basicGap.gap > 0) {
            suggestions.push({
                type: 'increase_sip',
                title: 'Increase Monthly SIP',
                description: `Increase your contribution by ₹${basicGap.gap.toLocaleString('en-IN')}/month`,
                impact: `Reach goal in ${yearsToRetirement} years`,
                priority: 'high',
                icon: '📈'
            });
        }

        // Suggestion 2: Retire later
        const delayedRetirement = this.calculateGoalBasedPlan({
            desiredMonthlyPension,
            currentAge,
            retirementAge: retirementAge + 3,
            riskProfile,
            existingSavings: params.existingSavings,
            annuityPercentage
        });

        if (delayedRetirement.requiredMonthlyContribution < basicGap.requiredMonthlyContribution) {
            suggestions.push({
                type: 'delay_retirement',
                title: 'Retire 3 Years Later',
                description: `Retiring at ${retirementAge + 3} reduces required SIP to ₹${delayedRetirement.requiredMonthlyContribution.toLocaleString('en-IN')}`,
                impact: `Save ₹${(basicGap.requiredMonthlyContribution - delayedRetirement.requiredMonthlyContribution).toLocaleString('en-IN')}/month`,
                priority: 'medium',
                icon: '⏰'
            });
        }

        // Suggestion 3: Change risk profile
        if (riskProfile !== 'aggressive' && yearsToRetirement > 10) {
            const aggressiveReturn = this.getExpectedReturn('aggressive');
            suggestions.push({
                type: 'increase_risk',
                title: 'Switch to Aggressive Profile',
                description: `Higher equity allocation (expected ${aggressiveReturn}% returns)`,
                impact: 'Potentially grow corpus faster with manageable risk',
                priority: yearsToRetirement > 15 ? 'high' : 'low',
                icon: '🎢'
            });
        }

        // Suggestion 4: Increase annuity percentage
        if (annuityPercentage < 60) {
            suggestions.push({
                type: 'increase_annuity',
                title: 'Higher Annuity Purchase',
                description: 'Choosing 60% annuity increases monthly pension',
                impact: 'More guaranteed income, less lump sum',
                priority: 'low',
                icon: '💰'
            });
        }

        return {
            ...basicGap,
            isOnTrack: basicGap.gap <= 0,
            gapMessage: basicGap.gap > 0
                ? `You are under-investing by ₹${basicGap.gap.toLocaleString('en-IN')}/month`
                : `Great! You are on track to meet your goal`,
            suggestions
        };
    }
}

export default new FinancialEngine();
