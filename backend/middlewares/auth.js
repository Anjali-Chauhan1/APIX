import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import mongoose from 'mongoose';

const demoUsers = new Map();

const isDbConnected = () => mongoose.connection.readyState === 1;

export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
      
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            if (!isDbConnected()) {
                req.user = {
                    _id: decoded.id,
                    name: 'Demo User',
                    email: 'demo@example.com',
                    age: 30,
                    monthlySalary: 50000,
                    existingSavings: 100000,
                    monthlyNPSContribution: 5000,
                    retirementAge: 60,
                    riskProfile: 'moderate',
                    expectedSalaryGrowth: 8,
                    desiredMonthlyPension: 30000,
                    preferredLanguage: 'en'
                };
                return next();
            }

            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            next();
        } catch (error) {
            console.error('Auth Error:', error);
            return res.status(401).json({
                success: false,
                message: 'Not authorized, token failed'
            });
        }
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized, no token'
        });
    }
};


export const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};
