import ChatHistory from '../models/ChatHistory.js';
import aiCoach from '../services/aiCoach.js';
import financialEngine from '../services/financial-engine/calculator.js';
import mongoose from 'mongoose';


const isDbConnected = () => mongoose.connection.readyState === 1;


export const chat = async (req, res) => {
    try {
        const { message, sessionId } = req.body;
        const user = req.user;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a message'
            });
        }

        const userProfile = {
            age: user.age || 30,
            retirementAge: user.retirementAge || 60,
            monthlySalary: user.monthlySalary || 50000,
            monthlyNPSContribution: user.monthlyNPSContribution || 5000,
            existingSavings: user.existingSavings || 0,
            riskProfile: user.riskProfile || 'moderate',
            expectedSalaryGrowth: user.expectedSalaryGrowth || 8,
            desiredMonthlyPension: user.desiredMonthlyPension || 30000
        };

        const projection = financialEngine.generateProjection(userProfile);

        if (!isDbConnected()) {
            const aiResponse = await aiCoach.getResponse(message, userProfile, projection, []);
            
            return res.json({
                success: true,
                data: {
                    message: aiResponse.success ? aiResponse.message : 'I can help you plan your retirement! Ask me about NPS contributions, pension calculations, or retirement strategies.',
                    sessionId: 'demo'
                }
            });
        }

        let chatHistory = await ChatHistory.findOne({
            userId: user._id,
            sessionId: sessionId || 'default'
        });

        const conversationHistory = chatHistory
            ? chatHistory.messages.map(msg => ({
                role: msg.role,
                content: msg.content
            }))
            : [];


        const aiResponse = await aiCoach.getResponse(
            message,
            userProfile,
            projection,
            conversationHistory.slice(-10)
        );

        if (!aiResponse.success) {
            return res.status(500).json({
                success: false,
                message: aiResponse.message
            });
        }

        if (!chatHistory) {
            chatHistory = await ChatHistory.create({
                userId: user._id,
                sessionId: sessionId || 'default',
                messages: []
            });
        }

        chatHistory.messages.push(
            {
                role: 'user',
                content: message,
                language: user.preferredLanguage
            },
            {
                role: 'assistant',
                content: aiResponse.message,
                language: user.preferredLanguage
            }
        );

        await chatHistory.save();

        res.json({
            success: true,
            data: {
                message: aiResponse.message,
                sessionId: chatHistory.sessionId
            }
        });
    } catch (error) {
        console.error('AI Chat Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing chat request'
        });
    }
};


export const getInsights = async (req, res) => {
    try {
        const user = req.user;

        const userProfile = {
            age: user.age || 30,
            retirementAge: user.retirementAge || 60,
            monthlySalary: user.monthlySalary || 50000,
            monthlyNPSContribution: user.monthlyNPSContribution || 5000,
            existingSavings: user.existingSavings || 0,
            riskProfile: user.riskProfile || 'moderate',
            expectedSalaryGrowth: user.expectedSalaryGrowth || 8,
            desiredMonthlyPension: user.desiredMonthlyPension || 30000
        };

        const projection = financialEngine.generateProjection(userProfile);

       
        const insights = await aiCoach.generateInsights(userProfile, projection);

       
        let contributionGap = null;
        if (userProfile.desiredMonthlyPension) {
            contributionGap = financialEngine.calculateContributionGap({
                currentMonthlyContribution: userProfile.monthlyNPSContribution,
                desiredMonthlyPension: userProfile.desiredMonthlyPension,
                yearsToRetirement: userProfile.retirementAge - userProfile.age,
                riskProfile: userProfile.riskProfile
            });
        }

        const actionSuggestions = aiCoach.generateActionSuggestions(projection, contributionGap);

        res.json({
            success: true,
            data: {
                insights,
                actionSuggestions,
                readinessScore: projection.results.retirementReadinessScore
            }
        });
    } catch (error) {
        console.error('Get Insights Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating insights'
        });
    }
};


export const getChatHistory = async (req, res) => {
    try {
        const { sessionId } = req.params;

        if (!isDbConnected()) {
            return res.json({
                success: true,
                data: {
                    messages: [],
                    sessionId: 'demo'
                }
            });
        }

        const chatHistory = await ChatHistory.findOne({
            userId: req.user._id,
            sessionId: sessionId || 'default'
        });

        if (!chatHistory) {
            return res.json({
                success: true,
                data: {
                    messages: []
                }
            });
        }

        res.json({
            success: true,
            data: {
                messages: chatHistory.messages,
                sessionId: chatHistory.sessionId
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching chat history'
        });
    }
};
