import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Target, Calculator, TrendingUp, TrendingDown, Info, RefreshCw } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import Card from '../components/Card';
import Button from '../components/Button';
import Slider from '../components/Slider';
import { projectionAPI } from '../services/api';
import { formatCurrency, cn } from '../utils/helpers';

const GoalPlanning = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  const [params, setParams] = useState({
    desiredMonthlyPension: 50000,
    currentAge: 30,
    retirementAge: 60,
    riskProfile: 'moderate',
    existingSavings: 0,
    annuityPercentage: 40,
    expectedSalaryGrowth: 8
  });

  useEffect(() => {
    calculateGoalPlan();
  }, []);

  const calculateGoalPlan = async () => {
    setLoading(true);
    try {
      const response = await projectionAPI.goalPlanning(params);
      if (response.data.success) {
        setResult(response.data.data);
      }
    } catch (error) {
      console.error('Goal Planning Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = () => {
    calculateGoalPlan();
  };

  const riskProfiles = [
    { value: 'conservative', label: 'Conservative', return: '8-9%', color: 'bg-blue-50 border-blue-200' },
    { value: 'moderate', label: 'Moderate', return: '10-11%', color: 'bg-primary-50 border-primary-200' },
    { value: 'aggressive', label: 'Aggressive', return: '12-14%', color: 'bg-orange-50 border-orange-200' }
  ];

  const contributionBreakdown = result?.yearlyPlan?.slice(0, 5) || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="flex items-center gap-2 text-primary-200 hover:text-white transition-colors mb-6 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-white/10 rounded-xl">
              <Target className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Goal-Based Planning</h1>
              <p className="text-primary-200">Reverse-engineer your retirement contribution</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Panel - Inputs */}
          <div className="lg:col-span-5">
            <Card className="sticky top-6">
              <div className="flex items-center gap-2 mb-6">
                <Calculator className="w-5 h-5 text-primary-600" />
                <Card.Title>Define Your Goal</Card.Title>
              </div>

              <div className="space-y-6">
                <Slider
                  label="Desired Monthly Pension"
                  value={params.desiredMonthlyPension}
                  min={20000}
                  max={200000}
                  step={5000}
                  prefix="₹"
                  onChange={(val) => setParams({ ...params, desiredMonthlyPension: val })}
                />

                <Slider
                  label="Current Age"
                  value={params.currentAge}
                  min={18}
                  max={55}
                  suffix=" Yrs"
                  onChange={(val) => setParams({ ...params, currentAge: val })}
                />

                <Slider
                  label="Retirement Age"
                  value={params.retirementAge}
                  min={Math.max(40, params.currentAge + 5)}
                  max={70}
                  suffix=" Yrs"
                  onChange={(val) => setParams({ ...params, retirementAge: val })}
                />

                <Slider
                  label="Existing NPS Savings"
                  value={params.existingSavings}
                  min={0}
                  max={5000000}
                  step={50000}
                  prefix="₹"
                  onChange={(val) => setParams({ ...params, existingSavings: val })}
                />

                <Slider
                  label="Annuity Percentage"
                  value={params.annuityPercentage}
                  min={40}
                  max={100}
                  suffix="%"
                  onChange={(val) => setParams({ ...params, annuityPercentage: val })}
                />

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Risk Profile</label>
                  <div className="grid grid-cols-3 gap-2">
                    {riskProfiles.map(profile => (
                      <button
                        key={profile.value}
                        onClick={() => setParams({ ...params, riskProfile: profile.value })}
                        className={cn(
                          "p-3 rounded-xl border-2 text-center transition-all",
                          params.riskProfile === profile.value 
                            ? `${profile.color} border-current ring-2 ring-offset-2`
                            : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                        )}
                      >
                        <p className="font-bold text-sm">{profile.label}</p>
                        <p className="text-xs text-gray-500">{profile.return}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={handleRecalculate} 
                  loading={loading}
                  className="w-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Calculate Required Contribution
                </Button>
              </div>
            </Card>
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-7 space-y-6">
            
            {loading ? (
              <Card className="text-center py-16">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto mb-4"
                />
                <p className="text-gray-500 font-medium">Calculating your retirement plan...</p>
              </Card>
            ) : result ? (
              <>
                {/* Main Result Card */}
                <Card className="bg-gradient-to-br from-primary-600 to-primary-800 text-white border-0">
                  <div className="text-center">
                    <p className="text-primary-200 text-sm font-medium mb-2">
                      To achieve {formatCurrency(params.desiredMonthlyPension)}/month pension
                    </p>
                    <p className="text-5xl font-black mb-3">
                      {formatCurrency(result.requiredMonthlyContribution)}
                      <span className="text-xl font-normal text-primary-200">/month</span>
                    </p>
                    <p className="text-primary-200 text-sm">
                      Required NPS contribution starting today
                    </p>
                  </div>

                  <div className="mt-8 grid grid-cols-3 gap-4">
                    <div className="bg-white/10 rounded-xl p-4 text-center">
                      <p className="text-primary-200 text-xs mb-1">Target Corpus</p>
                      <p className="text-xl font-bold">{formatCurrency(result.targetCorpus, true)}</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 text-center">
                      <p className="text-primary-200 text-xs mb-1">Years to Invest</p>
                      <p className="text-xl font-bold">{result.yearsToRetirement} Yrs</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 text-center">
                      <p className="text-primary-200 text-xs mb-1">Expected Return</p>
                      <p className="text-xl font-bold">{result.expectedReturn}%</p>
                    </div>
                  </div>
                </Card>

                {/* Breakdown */}
                <Card>
                  <Card.Title>Contribution vs Growth Breakdown</Card.Title>
                  <Card.Description className="mb-6">See how your contributions compound over time</Card.Description>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-primary-50 rounded-xl p-4">
                      <p className="text-xs text-primary-600 font-medium mb-1">Total Contributions</p>
                      <p className="text-2xl font-bold text-primary-800">{formatCurrency(result.totalContributions, true)}</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4">
                      <p className="text-xs text-green-600 font-medium mb-1">Total Returns Earned</p>
                      <p className="text-2xl font-bold text-green-800">{formatCurrency(result.totalReturns, true)}</p>
                    </div>
                  </div>

                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={result.yearlyPlan}>
                        <defs>
                          <linearGradient id="colorContrib" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorCorpus" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#16A34A" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis 
                          dataKey="year" 
                          axisLine={false} 
                          tickLine={false}
                          tick={{ fontSize: 11, fill: '#9CA3AF' }}
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: '#9CA3AF' }}
                          tickFormatter={(value) => `₹${(value/100000).toFixed(0)}L`}
                        />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-4 shadow-xl rounded-xl border border-gray-100">
                                  <p className="text-xs text-gray-500 font-bold mb-2">Year {payload[0].payload.year}</p>
                                  <p className="text-sm font-bold text-primary-600">Corpus: {formatCurrency(payload[0].payload.corpus)}</p>
                                  <p className="text-xs text-gray-500 mt-1">Contributed: {formatCurrency(payload[0].payload.totalContributed)}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="corpus" 
                          stroke="#16A34A" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorCorpus)" 
                          name="Corpus"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="totalContributed" 
                          stroke="#2563EB" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorContrib)" 
                          name="Contributed"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Assumptions Panel */}
                <Card className="bg-gray-50 border-0">
                  <div className="flex items-center gap-2 mb-4">
                    <Info className="w-5 h-5 text-gray-500" />
                    <Card.Title className="text-base text-gray-700">Assumptions & Notes</Card.Title>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0"></span>
                      <span>Expected annual return: {result.expectedReturn}% based on {params.riskProfile} risk profile</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0"></span>
                      <span>Annuity rate assumed at 6.5% p.a. (typical government annuity provider rate)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0"></span>
                      <span>{params.annuityPercentage}% of corpus will be used for annuity purchase at retirement</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0"></span>
                      <span>Monthly contribution is calculated for a fixed SIP (not step-up)</span>
                    </li>
                  </ul>
                </Card>

                {/* Alternative Scenarios */}
                <Card>
                  <Card.Title>What If Scenarios</Card.Title>
                  <Card.Description className="mb-4">See how changes affect your required contribution</Card.Description>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                      <p className="text-xs text-green-600 font-medium mb-2">If you retire 5 years later</p>
                      <p className="text-lg font-bold text-green-800">
                        {formatCurrency(Math.round(result.requiredMonthlyContribution * 0.65))}/mo
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        <TrendingDown className="w-3 h-3 inline mr-1" />
                        35% less contribution
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
                      <p className="text-xs text-orange-600 font-medium mb-2">If pension goal is 50% higher</p>
                      <p className="text-lg font-bold text-orange-800">
                        {formatCurrency(Math.round(result.requiredMonthlyContribution * 1.5))}/mo
                      </p>
                      <p className="text-xs text-orange-600 mt-1">
                        <TrendingUp className="w-3 h-3 inline mr-1" />
                        50% more contribution
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                      <p className="text-xs text-blue-600 font-medium mb-2">If aggressive profile</p>
                      <p className="text-lg font-bold text-blue-800">
                        {formatCurrency(Math.round(result.requiredMonthlyContribution * 0.8))}/mo
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        <TrendingDown className="w-3 h-3 inline mr-1" />
                        20% less contribution
                      </p>
                    </div>
                  </div>
                </Card>
              </>
            ) : (
              <Card className="text-center py-16">
                <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-700 mb-2">Set Your Retirement Goal</h3>
                <p className="text-gray-500">Adjust the parameters and calculate your required contribution</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalPlanning;
