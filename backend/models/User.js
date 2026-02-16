import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide your name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 6,
        select: false
    },
    age: {
        type: Number,
        required: [true, 'Please provide your age'],
        min: 18,
        max: 100
    },
    monthlySalary: {
        type: Number,
        required: [true, 'Please provide your monthly salary'],
        min: 0
    },
    existingSavings: {
        type: Number,
        default: 0,
        min: 0
    },
    monthlyNPSContribution: {
        type: Number,
        required: [true, 'Please provide your monthly NPS contribution'],
        min: 0
    },
    retirementAge: {
        type: Number,
        required: [true, 'Please provide your desired retirement age'],
        min: 40,
        max: 100
    },
    riskProfile: {
        type: String,
        enum: ['conservative', 'moderate', 'aggressive'],
        default: 'moderate'
    },
    expectedSalaryGrowth: {
        type: Number,
        default: 8, // 8% annual growth
        min: 0,
        max: 30
    },
    desiredMonthlyPension: {
        type: Number,
        default: null,
        min: 0
    },
    preferredLanguage: {
        type: String,
        default: 'en',
        enum: ['en', 'hi', 'bn', 'mr', 'te', 'ta', 'gu', 'kn', 'ml', 'pa', 'or', 'as', 'ur']
    },
    goals: [{
        name: String,
        targetAmount: Number,
        targetDate: Date,
        priority: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium'
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
