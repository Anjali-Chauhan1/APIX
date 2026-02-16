import OpenAI from 'openai';



class AICoachService {
    constructor() {
        this.openai = null;
        this.initialize();
    }

    initialize() {
        if (process.env.OPENAI_API_KEY) {
            this.openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY
            });
        }
    }

    
    generateSystemPrompt(userProfile, projectionData) {
        return `You are a friendly and knowledgeable retirement planning advisor specializing in India's National Pension System (NPS). 

User Profile:
- Age: ${userProfile.age} years
- Monthly Salary: ₹${userProfile.monthlySalary?.toLocaleString('en-IN')}
- Current NPS Contribution: ₹${userProfile.monthlyNPSContribution?.toLocaleString('en-IN')}/month
- Retirement Age: ${userProfile.retirementAge}
- Years to Retirement: ${userProfile.retirementAge - userProfile.age}
- Risk Profile: ${userProfile.riskProfile}

Current Projection:
- Expected Corpus at Retirement: ₹${projectionData?.results?.totalCorpus?.toLocaleString('en-IN')}
- Expected Monthly Pension: ₹${projectionData?.results?.monthlyPension?.toLocaleString('en-IN')}
- Retirement Readiness Score: ${projectionData?.results?.retirementReadinessScore}%
- Risk Level: ${projectionData?.results?.riskLevel}

Your role:
1. Provide clear, actionable retirement planning advice
2. Explain financial concepts in simple terms
3. Be encouraging and motivational
4. Suggest specific actions to improve retirement readiness
5. Answer questions about NPS, pension calculations, and retirement planning
6. Use Indian context and currency (₹)
7. Keep responses concise (2-3 paragraphs max)

Always be supportive and help users make informed decisions about their retirement.`;
    }

    async getResponse(userMessage, userProfile, projectionData, conversationHistory = []) {
        if (!this.openai) {
            return {
                success: false,
                message: 'AI Coach is not configured. Please add OPENAI_API_KEY to environment variables.'
            };
        }

        try {
            const systemPrompt = this.generateSystemPrompt(userProfile, projectionData);

            const messages = [
                { role: 'system', content: systemPrompt },
                ...conversationHistory,
                { role: 'user', content: userMessage }
            ];

            const completion = await this.openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages,
                temperature: 0.7,
                max_tokens: 500
            });

            const response = completion.choices[0].message.content;

            return {
                success: true,
                message: response,
                usage: completion.usage
            };
        } catch (error) {
            console.error('AI Coach Error:', error);
            return {
                success: false,
                message: 'Sorry, I encountered an error. Please try again.',
                error: error.message
            };
        }
    }

   
    async generateInsights(userProfile, projectionData) {
        if (!this.openai) {
            return this.getFallbackInsights(projectionData);
        }

        try {
            const prompt = `Based on this retirement profile, provide 3 key insights in bullet points:
- Retirement Readiness: ${projectionData.results.retirementReadinessScore}%
- Monthly Pension: ₹${projectionData.results.monthlyPension?.toLocaleString('en-IN')}
- Years to Retirement: ${projectionData.results.yearsToRetirement}
- Risk Level: ${projectionData.results.riskLevel}

Keep each insight to one short sentence.`;

            const completion = await this.openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 200
            });

            const response = completion.choices[0].message.content;
            const insights = response.split('\n').filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'));

            return insights.slice(0, 3);
        } catch (error) {
            return this.getFallbackInsights(projectionData);
        }
    }

    /**
     * Fallback insights when AI is not available
     */
    getFallbackInsights(projectionData) {
        const insights = [];
        const score = projectionData.results.retirementReadinessScore;

        if (score < 40) {
            insights.push('⚠️ Your retirement readiness needs immediate attention');
            insights.push('💡 Consider increasing your monthly contribution by 20-30%');
            insights.push('📈 Switching to a moderate risk profile could boost returns');
        } else if (score < 70) {
            insights.push('📊 You\'re on the right track, but there\'s room for improvement');
            insights.push('💰 Small increases in contribution can make a big difference');
            insights.push('🎯 Review your retirement age and contribution strategy');
        } else {
            insights.push('✅ Excellent! You\'re well-prepared for retirement');
            insights.push('🌟 Continue your disciplined investment approach');
            insights.push('📅 Consider retiring earlier or increasing your pension goal');
        }

        return insights;
    }

    /**
     * Generate action suggestions
     */
    generateActionSuggestions(projectionData, contributionGap) {
        const suggestions = [];
        const score = projectionData.results.retirementReadinessScore;

        if (contributionGap && contributionGap.gap > 0) {
            suggestions.push({
                title: 'Increase Monthly Contribution',
                description: `Add ₹${contributionGap.gap.toLocaleString('en-IN')}/month to reach your pension goal`,
                priority: 'high',
                impact: 'high'
            });
        }

        if (score < 50) {
            suggestions.push({
                title: 'Extend Retirement Age',
                description: 'Working 2-3 more years can significantly boost your corpus',
                priority: 'medium',
                impact: 'high'
            });
        }

        if (projectionData.inputs.expectedReturn < 9) {
            suggestions.push({
                title: 'Review Risk Profile',
                description: 'Consider a moderate risk profile for better returns',
                priority: 'medium',
                impact: 'medium'
            });
        }

        suggestions.push({
            title: 'Automate Contributions',
            description: 'Set up auto-debit to never miss a contribution',
            priority: 'low',
            impact: 'medium'
        });

        return suggestions;
    }
}

export default new AICoachService();
