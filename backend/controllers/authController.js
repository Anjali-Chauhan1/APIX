import User from '../models/User.js';
import { generateToken } from '../middlewares/auth.js';
import mongoose from 'mongoose';

const demoUsers = new Map();


const isDbConnected = () => mongoose.connection.readyState === 1;

export const register = async (req, res) => {
    console.log('📝 Registration attempt for:', req.body?.email);
    try {
        const {
            name,
            email,
            password,
            age,
            monthlySalary,
            existingSavings,
            monthlyNPSContribution,
            retirementAge,
            riskProfile,
            expectedSalaryGrowth,
            desiredMonthlyPension,
            preferredLanguage
        } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email, and password'
            });
        }

        const parsedAge = Number(age);
        const parsedMonthlySalary = Number(monthlySalary);
        const parsedMonthlyNPSContribution = Number(monthlyNPSContribution);
        const parsedRetirementAge = Number(retirementAge);
        const parsedExistingSavings = existingSavings === undefined ? 0 : Number(existingSavings);
        const parsedExpectedSalaryGrowth = expectedSalaryGrowth === undefined ? 8 : Number(expectedSalaryGrowth);
        const parsedDesiredMonthlyPension = desiredMonthlyPension === undefined || desiredMonthlyPension === null || desiredMonthlyPension === ''
            ? null
            : Number(desiredMonthlyPension);

        if (
            !Number.isFinite(parsedAge) ||
            !Number.isFinite(parsedMonthlySalary) ||
            !Number.isFinite(parsedMonthlyNPSContribution) ||
            !Number.isFinite(parsedRetirementAge)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid numeric inputs. Please provide valid age, salary, contribution, and retirement age.'
            });
        }

        if (
            !Number.isFinite(parsedExistingSavings) ||
            !Number.isFinite(parsedExpectedSalaryGrowth) ||
            (parsedDesiredMonthlyPension !== null && !Number.isFinite(parsedDesiredMonthlyPension))
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid optional numeric inputs.'
            });
        }

        const normalizedEmail = String(email).toLowerCase().trim();
        const safePassword = password != null ? String(password) : '';

        if (!isDbConnected()) {
            if (demoUsers.has(normalizedEmail)) {
                return res.status(400).json({
                    success: false,
                    message: 'User already exists with this email'
                });
            }

            try {
                const demoUser = {
                    _id: 'demo_' + Date.now(),
                    name,
                    email: normalizedEmail,
                    age: parsedAge,
                    monthlySalary: parsedMonthlySalary,
                    existingSavings: parsedExistingSavings,
                    monthlyNPSContribution: parsedMonthlyNPSContribution,
                    retirementAge: parsedRetirementAge,
                    riskProfile: riskProfile || 'moderate',
                    expectedSalaryGrowth: parsedExpectedSalaryGrowth,
                    desiredMonthlyPension: parsedDesiredMonthlyPension,
                    preferredLanguage: preferredLanguage || 'en'
                };

                demoUsers.set(normalizedEmail, demoUser);
                const token = generateToken(demoUser._id);

                return res.status(201).json({
                    success: true,
                    message: 'User registered successfully (Demo Mode)',
                    data: { ...demoUser, token }
                });
            } catch (demoErr) {
                console.error('Register Demo Error:', demoErr);
                return res.status(500).json({
                    success: false,
                    message: 'Registration failed in demo mode. Please try again.'
                });
            }
        }

        const userExists = await User.findOne({ email: normalizedEmail });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        const user = await User.create({
            name,
            email: normalizedEmail,
            password: safePassword,
            age: parsedAge,
            monthlySalary: parsedMonthlySalary,
            existingSavings: parsedExistingSavings,
            monthlyNPSContribution: parsedMonthlyNPSContribution,
            retirementAge: parsedRetirementAge,
            riskProfile: riskProfile || 'moderate',
            expectedSalaryGrowth: parsedExpectedSalaryGrowth,
            desiredMonthlyPension: parsedDesiredMonthlyPension,
            preferredLanguage: (preferredLanguage && ['en', 'hi', 'bn', 'mr', 'te', 'ta', 'gu', 'kn', 'ml', 'pa', 'or', 'as', 'ur'].includes(preferredLanguage)) ? preferredLanguage : 'en'
        });

        if (user) {
            const token = generateToken(user._id);

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    age: user.age,
                    monthlySalary: user.monthlySalary,
                    monthlyNPSContribution: user.monthlyNPSContribution,
                    retirementAge: user.retirementAge,
                    riskProfile: user.riskProfile,
                    preferredLanguage: user.preferredLanguage,
                    token
                }
            });
        } else {
            return res.status(500).json({
                success: false,
                message: 'Unable to create user'
            });
        }
    } catch (error) {
        console.error('Register Error FULL:', error);

        if (error?.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        if (error?.name === 'ValidationError') {
            const validationMessage = Object.values(error.errors || {})
                .map((e) => e.message)
                .join(', ');
            return res.status(400).json({
                success: false,
                message: validationMessage || 'Invalid registration data',
                error: error.name
            });
        }

        res.status(500).json({
            success: false,
            message: error.message || 'Error registering user',
            error: error.name // Add error name for easier debugging
        });
    }
};


export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = String(email || '').toLowerCase().trim();


        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }


        if (!isDbConnected()) {
            let demoUser = demoUsers.get(normalizedEmail);

            if (!demoUser) {
                demoUser = {
                    _id: 'demo_' + Date.now(),
                    name: normalizedEmail.split('@')[0],
                    email: normalizedEmail,
                    age: 30,
                    monthlySalary: 50000,
                    existingSavings: 100000,
                    monthlyNPSContribution: 5000,
                    retirementAge: 60,
                    riskProfile: 'moderate',
                    expectedSalaryGrowth: 8,
                    preferredLanguage: 'en'
                };
                demoUsers.set(normalizedEmail, demoUser);
            }

            const token = generateToken(demoUser._id);

            return res.json({
                success: true,
                message: 'Login successful (Demo Mode)',
                data: { ...demoUser, token }
            });
        }

        const user = await User.findOne({ email: normalizedEmail }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const token = generateToken(user._id);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                age: user.age,
                monthlySalary: user.monthlySalary,
                monthlyNPSContribution: user.monthlyNPSContribution,
                retirementAge: user.retirementAge,
                riskProfile: user.riskProfile,
                preferredLanguage: user.preferredLanguage,
                token
            }
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in'
        });
    }
};

export const getMe = async (req, res) => {
    try {
        // Demo users (no DB or id starts with 'demo_') – return in-memory user
        const id = req.user?._id;
        if (!isDbConnected() || (typeof id === 'string' && id.startsWith('demo_'))) {
            return res.json({
                success: true,
                data: req.user
            });
        }
        const user = await User.findById(id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('GetMe Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user profile'
        });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const id = req.user?._id;
        // Demo users – update in-memory only (no DB)
        if (!isDbConnected() || (typeof id === 'string' && id.startsWith('demo_'))) {
            const allowedUpdates = [
                'name', 'age', 'monthlySalary', 'existingSavings', 'monthlyNPSContribution',
                'retirementAge', 'riskProfile', 'expectedSalaryGrowth', 'desiredMonthlyPension',
                'preferredLanguage', 'goals'
            ];
            const updated = { ...req.user, ...req.body };
            allowedUpdates.forEach(field => {
                if (req.body[field] !== undefined) updated[field] = req.body[field];
            });
            return res.json({
                success: true,
                message: 'Profile updated successfully (Demo)',
                data: updated
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update fields
        const allowedUpdates = [
            'name',
            'age',
            'monthlySalary',
            'existingSavings',
            'monthlyNPSContribution',
            'retirementAge',
            'riskProfile',
            'expectedSalaryGrowth',
            'desiredMonthlyPension',
            'preferredLanguage',
            'goals'
        ];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                user[field] = req.body[field];
            }
        });

        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: user
        });
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile'
        });
    }
};
