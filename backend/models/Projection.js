import mongoose from 'mongoose';

const projectionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    projectionType: {
        type: String,
        enum: ['standard', 'scenario', 'goal-based', 'monte-carlo'],
        default: 'standard'
    },
    inputs: {
        currentAge: Number,
        retirementAge: Number,
        monthlySalary: Number,
        monthlyContribution: Number,
        existingSavings: Number,
        salaryGrowth: Number,
        inflationRate: Number,
        expectedReturn: Number,
        annuityPercentage: Number
    },
    results: {
        totalCorpus: Number,
        inflationAdjustedCorpus: Number,
        annuityAmount: Number,
        monthlyPension: Number,
        lumpSum: Number,
        retirementReadinessScore: Number,
        yearsToRetirement: Number,
        totalContributions: Number,
        totalReturns: Number,
        riskLevel: {
            type: String,
            enum: ['low', 'moderate', 'high']
        }
    },
    yearlyBreakdown: [{
        year: Number,
        age: Number,
        contribution: Number,
        corpusValue: Number,
        returns: Number
    }],
    scenarioName: String,
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 2592000 
    }
}, {
    timestamps: true
});

projectionSchema.index({ userId: 1, createdAt: -1 });

const Projection = mongoose.model('Projection', projectionSchema);

export default Projection;
