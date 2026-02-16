import User from '../models/User.js';
import { generateToken } from '../middlewares/auth.js';
import mongoose from 'mongoose';

const demoUsers = new Map();


const isDbConnected = () => mongoose.connection.readyState === 1;

export const register = async (req, res) => {
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

        if (!isDbConnected()) {
            const demoUser = {
                _id: 'demo_' + Date.now(),
                name,
                email,
                age: age || 25,
                monthlySalary: monthlySalary || 50000,
                existingSavings: existingSavings || 0,
                monthlyNPSContribution: monthlyNPSContribution || 5000,
                retirementAge: retirementAge || 60,
                riskProfile: riskProfile || 'moderate',
                expectedSalaryGrowth: expectedSalaryGrowth || 8,
                desiredMonthlyPension,
                preferredLanguage: preferredLanguage || 'en'
            };
            
            demoUsers.set(email, demoUser);
            const token = generateToken(demoUser._id);
            
            return res.status(201).json({
                success: true,
                message: 'User registered successfully (Demo Mode)',
                data: { ...demoUser, token }
            });
        }

      
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        const user = await User.create({
            name,
            email,
            password,
            age,
            monthlySalary,
            existingSavings: existingSavings || 0,
            monthlyNPSContribution,
            retirementAge,
            riskProfile: riskProfile || 'moderate',
            expectedSalaryGrowth: expectedSalaryGrowth || 8,
            desiredMonthlyPension,
            preferredLanguage: preferredLanguage || 'en'
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
        }
    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error registering user'
        });
    }
};


export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

      
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        const user = await User.findOne({ email }).select('+password');

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
        const user = await User.findById(req.user._id);

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user profile'
        });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

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
