import mongoose from 'mongoose';

const scenarioSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: String,
    parameters: {
        monthlyContribution: Number,
        retirementAge: Number,
        salaryGrowth: Number,
        riskProfile: String,
        annuityPercentage: Number
    },
    projectionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Projection'
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const Scenario = mongoose.model('Scenario', scenarioSchema);

export default Scenario;
