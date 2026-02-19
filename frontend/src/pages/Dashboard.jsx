import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import {
  TrendingUp, Wallet, ShieldCheck, AlertCircle, AlertTriangle,
  MessageSquare, Settings, Users, ArrowUpRight, Target, Zap,
  Clock, ChevronRight, Info, Calendar, Heart,
  TrendingDown, BarChart3, PiggyBank, Lightbulb, Shield,
  Play, Pause, RefreshCw, User, LogOut
} from 'lucide-react';
import Card from '../components/Card';
import AICoach from '../components/AICoach';
import Button from '../components/Button';
import Slider from '../components/Slider';
import { useAuthStore } from '../store/authStore';
import { useProjectionStore } from '../store/projectionStore';
import { projectionAPI, aiCoachAPI, getSocket } from '../services/api';
import { formatCurrency, getReadinessColor, getReadinessBgColor, cn } from '../utils/helpers';
import { useSearchParams } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, logout } = useAuthStore();
  const { currentProjection, setProjection, isLoading, setLoading } = useProjectionStore();
  const [insights, setInsights] = useState([]);
  const [showAI, setShowAI] = useState(false);
  
  const activeTab = searchParams.get('tab') || 'overview';
  const setActiveTab = (tab) => setSearchParams({ tab });

  // Extended state for all features
  const [realityShock, setRealityShock] = useState(null);
  const [contributionGap, setContributionGap] = useState(null);
  const [pensionSimulation, setPensionSimulation] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [monteCarloResults, setMonteCarloResults] = useState(null);
  const [familyProtection, setFamilyProtection] = useState(null);
  const [assumptions, setAssumptions] = useState(null);
  const [salarySimulation, setSalarySimulation] = useState(null);

  // Logout handler
  const handleLogout = () => {
    logout();
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Local state for interactive sliders (Phase 3)
  const [params, setParams] = useState({
    age: user?.age || 30,
    monthlyNPSContribution: user?.monthlyNPSContribution || 5000,
    retirementAge: user?.retirementAge || 60,
    expectedSalaryGrowth: user?.expectedSalaryGrowth || 8,
    riskProfile: user?.riskProfile || 'moderate',
    annuityPercentage: 40,
    inflationRate: 6,
    desiredMonthlyPension: user?.desiredMonthlyPension || 50000,
    monthlySalary: user?.monthlySalary || 50000,
    existingSavings: user?.existingSavings || 0
  });

  // WebSocket connection for real-time updates
  useEffect(() => {
    const socket = getSocket();

    socket.on('projection-result', (result) => {
      if (result.success) {
        setProjection(result.data.projection);
        setRealityShock(result.data.realityShock);
        setPensionSimulation(result.data.pensionSimulation);
      }
    });

    return () => {
      socket.off('projection-result');
    };
  }, []);

  useEffect(() => {
    fetchAllData();
  }, []);

  // Debounced calculate for sliders - real-time updates
  useEffect(() => {
    const timer = setTimeout(() => {
      calculateLive();
    }, 300);
    return () => clearTimeout(timer);
  }, [params]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [projectionRes, insightsRes, assumptionsRes] = await Promise.all([
        projectionAPI.generate({ ...params, name: user?.name }),
        aiCoachAPI.getInsights(),
        projectionAPI.getAssumptions()
      ]);

      if (projectionRes.data.success) {
        const data = projectionRes.data.data;
        setProjection(data.projection);
        setRealityShock(data.realityShock);
        setContributionGap(data.contributionGap);
        setTimeline(data.timeline);
        setPensionSimulation(data.pensionSimulation);
      }

      if (insightsRes.data.success) {
        setInsights(insightsRes.data.data.insights);
      }

      if (assumptionsRes.data.success) {
        setAssumptions(assumptionsRes.data.data);
      }

      // Fetch Monte Carlo
      const monteCarloRes = await projectionAPI.monteCarlo({
        monthlyContribution: params.monthlyNPSContribution,
        retirementAge: params.retirementAge,
        riskProfile: params.riskProfile,
        salaryGrowth: params.expectedSalaryGrowth,
        existingSavings: params.existingSavings,
        targetCorpus: params.desiredMonthlyPension * 12 / 0.065 / 0.4
      });

      if (monteCarloRes.data.success) {
        setMonteCarloResults(monteCarloRes.data.data);
      }

      // Fetch family protection
      const familyRes = await projectionAPI.familyProtection({
        currentAge: params.age,
        retirementAge: params.retirementAge,
        monthlyNPSContribution: params.monthlyNPSContribution,
        existingSavings: params.existingSavings,
        riskProfile: params.riskProfile,
        expectedSalaryGrowth: params.expectedSalaryGrowth,
        stopContributionAge: params.age + 10
      });

      if (familyRes.data.success) {
        setFamilyProtection(familyRes.data.data);
      }

      // Fetch salary simulation
      const salaryRes = await projectionAPI.salarySimulation(params);
      if (salaryRes.data.success) {
        setSalarySimulation(salaryRes.data.data);
      }

    } catch (error) {
      console.error("Fetch All Data Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateLive = async () => {
    try {
      // 1. Use WebSocket for 'instant' calculation if connected
      const socket = getSocket();
      if (socket.connected) {
        socket.emit('calculate-projection', { ...params, name: user?.name });
      }

      // 2. Also use HTTP as a reliable backup/complement
      // This ensures all derived data (readiness, shock, gap) is updated
      const [projectionRes, gapRes] = await Promise.all([
        projectionAPI.generate({ ...params, name: user?.name }),
        projectionAPI.gapDetector({
          monthlyNPSContribution: params.monthlyNPSContribution,
          desiredMonthlyPension: params.desiredMonthlyPension,
          currentAge: params.age,
          retirementAge: params.retirementAge,
          riskProfile: params.riskProfile,
          existingSavings: params.existingSavings,
          annuityPercentage: params.annuityPercentage
        })
      ]);

      if (projectionRes.data.success) {
        const data = projectionRes.data.data;
        setProjection(data.projection);
        setRealityShock(data.realityShock);
        setTimeline(data.timeline);
        setPensionSimulation(data.pensionSimulation);
        // Note: contributionGap is handled by the other call
      }

      if (gapRes.data.success) {
        setContributionGap(gapRes.data.data);
      }
    } catch (error) {
      console.error("Live Calculation Error:", error);
    }
  };

  // Rupee icon component
  const IndianRupee = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3c4.5 0 4.5-5 0-5H6" />
    </svg>
  );

  if (!currentProjection) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white">
      <div className="text-center">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="h-16 w-16 bg-primary-600 rounded-2xl mb-6 mx-auto flex items-center justify-center"
        >
          <IndianRupee className="text-white w-8 h-8" />
        </motion.div>
        <p className="text-gray-600 font-semibold text-lg">Analyzing your financial future...</p>
        <p className="text-gray-400 text-sm mt-2">Running 1000+ simulations</p>
      </div>
    </div>
  );

  const { results, yearlyBreakdown } = currentProjection;

  const COLORS = ['#2563EB', '#16A34A', '#F59E0B', '#DC2626'];

  // Calculator icon component
  const Calculator = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="8" y1="6" x2="16" y2="6" />
      <line x1="8" y1="10" x2="10" y2="10" />
      <line x1="14" y1="10" x2="16" y2="10" />
      <line x1="8" y1="14" x2="10" y2="14" />
      <line x1="14" y1="14" x2="16" y2="14" />
      <line x1="8" y1="18" x2="16" y2="18" />
    </svg>
  );

  return (
    <div className="pb-20">

      {/* Hero Stats Section */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white py-5 sm:py-8 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
            <div>
              <p className="text-primary-200 text-xs sm:text-sm font-medium mb-1">Welcome back, {user?.name || 'Investor'}</p>
              <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold">Your Retirement Roadmap</h1>
              <p className="text-primary-100 mt-1 text-sm">You are <span className="text-white font-bold">{results.retirementReadinessScore}%</span> ready for retirement</p>
            </div>
            <div className="grid grid-cols-3 gap-2 xs:gap-3 w-full md:w-auto md:flex md:flex-wrap">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl xs:rounded-2xl p-2.5 xs:p-3 sm:p-4">
                <p className="text-primary-200 text-[10px] xs:text-xs font-medium mb-0.5">Corpus</p>
                <p className="text-sm xs:text-base sm:text-2xl font-bold truncate">{formatCurrency(results.totalCorpus, true)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl xs:rounded-2xl p-2.5 xs:p-3 sm:p-4">
                <p className="text-primary-200 text-[10px] xs:text-xs font-medium mb-0.5">Pension/mo</p>
                <p className="text-sm xs:text-base sm:text-2xl font-bold truncate">{formatCurrency(results.monthlyPension)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl xs:rounded-2xl p-2.5 xs:p-3 sm:p-4">
                <p className="text-primary-200 text-[10px] xs:text-xs font-medium mb-0.5">Years Left</p>
                <p className="text-sm xs:text-base sm:text-2xl font-bold">{results.yearsToRetirement} Yrs</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8"></div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Left Column */}
              <div className="lg:col-span-8 space-y-6">

                {/* Wealth Growth Chart */}
                <Card className="overflow-hidden">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <Card.Title>Wealth Growth Projection</Card.Title>
                      <Card.Description>Your corpus growth over time</Card.Description>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-primary-600"></div>
                        <span className="font-medium text-gray-600">Corpus</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="font-medium text-gray-600">Contributions</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={yearlyBreakdown}>
                        <defs>
                          <linearGradient id="colorCorpus" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis
                          dataKey="age"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: '#9CA3AF' }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: '#9CA3AF' }}
                          tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-4 shadow-xl rounded-xl border border-gray-100">
                                  <p className="text-xs text-gray-500 font-bold mb-2">AGE {payload[0].payload.age}</p>
                                  <p className="text-lg font-bold text-primary-600">{formatCurrency(payload[0].value)}</p>
                                  <p className="text-xs text-gray-500 mt-1">Returns: {formatCurrency(payload[0].payload.returns)}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="corpusValue"
                          stroke="#2563EB"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorCorpus)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Reality Shock + Contribution Gap Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Reality Shock Meter 🚨 */}
                  <Card className={cn(
                    "relative overflow-hidden",
                    realityShock?.riskLevel === 'high' ? "bg-gradient-to-br from-red-600 to-red-800" :
                      realityShock?.riskLevel === 'moderate' ? "bg-gradient-to-br from-orange-500 to-orange-700" :
                        "bg-gradient-to-br from-green-600 to-green-800",
                    "text-white border-0"
                  )}>
                    <div className="absolute top-0 right-0 opacity-10">
                      <AlertTriangle className="w-32 h-32 -mt-8 -mr-8" />
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-xs font-bold uppercase tracking-widest opacity-80">Reality Shock Meter</span>
                    </div>
                    <h4 className="text-xl font-bold mb-2">{realityShock?.message || 'Loading...'}</h4>
                    <p className="text-sm opacity-90 leading-relaxed mb-4">
                      Inflation will erode your purchasing power. Your planned ₹{results.monthlyPension?.toLocaleString('en-IN')}/month will feel like ₹{Math.round(results.monthlyPension / parseFloat(realityShock?.multiplier || 1))?.toLocaleString('en-IN')} in today's terms.
                    </p>
                    <div className="bg-white/20 rounded-xl p-3 flex items-center gap-3">
                      <div className={cn(
                        "w-3 h-3 rounded-full animate-pulse",
                        realityShock?.riskLevel === 'high' ? "bg-red-300" :
                          realityShock?.riskLevel === 'moderate' ? "bg-orange-300" : "bg-green-300"
                      )}></div>
                      <span className="text-sm font-bold uppercase">{realityShock?.riskLevel} Risk</span>
                    </div>
                  </Card>

                  {/* Contribution Gap Detector 📉 */}
                  <Card>
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingDown className="w-5 h-5 text-primary-600" />
                      <Card.Title className="text-base">Contribution Gap Detector</Card.Title>
                    </div>

                    {contributionGap && (
                      <>
                        <div className={cn(
                          "p-4 rounded-xl mb-4",
                          contributionGap.isOnTrack ? "bg-green-50" : "bg-red-50"
                        )}>
                          <p className={cn(
                            "font-bold",
                            contributionGap.isOnTrack ? "text-green-700" : "text-red-700"
                          )}>
                            {contributionGap.gapMessage}
                          </p>
                        </div>

                        {contributionGap.suggestions?.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Suggestions</p>
                            {contributionGap.suggestions.slice(0, 2).map((suggestion, i) => (
                              <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                                <span className="text-lg">{suggestion.icon}</span>
                                <div>
                                  <p className="font-semibold text-sm text-gray-800">{suggestion.title}</p>
                                  <p className="text-xs text-gray-500">{suggestion.impact}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </Card>
                </div>

                {/* AI Insights */}
                <Card>
                  <Card.Title className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-primary-600" />
                    AI Smart Insights
                  </Card.Title>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {insights.length > 0 ? insights.slice(0, 4).map((insight, i) => (
                      <div key={i} className="flex gap-3 items-start p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-all">
                        <div className="mt-0.5 w-2 h-2 rounded-full bg-primary-600 shrink-0"></div>
                        <p className="text-sm text-gray-700 leading-relaxed">{insight}</p>
                      </div>
                    )) : (
                      <div className="col-span-2 animate-pulse space-y-3">
                        <div className="h-12 bg-gray-100 rounded-xl"></div>
                        <div className="h-12 bg-gray-100 rounded-xl"></div>
                      </div>
                    )}
                  </div>
                </Card>

              </div>

              {/* Right Column */}
              <div className="lg:col-span-4 space-y-6">

                {/* Readiness Score Gauge */}
                <Card className="text-center flex flex-col items-center">
                  <Card.Title className="mb-6">Retirement Readiness</Card.Title>
                  <div className="relative w-44 h-44 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="88"
                        cy="88"
                        r="75"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="transparent"
                        className="text-gray-100"
                      />
                      <motion.circle
                        cx="88"
                        cy="88"
                        r="75"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="transparent"
                        strokeDasharray={471}
                        initial={{ strokeDashoffset: 471 }}
                        animate={{ strokeDashoffset: 471 - (471 * results.retirementReadinessScore) / 100 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className={cn(getReadinessColor(results.retirementReadinessScore))}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-black">{results.retirementReadinessScore}%</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">Ready</span>
                    </div>
                  </div>
                  <div className={cn(
                    "mt-6 px-5 py-2.5 rounded-full text-sm font-bold shadow-lg",
                    getReadinessBgColor(results.retirementReadinessScore),
                    "text-white"
                  )}>
                    {results.riskLevel?.toUpperCase()} RISK
                  </div>
                </Card>

                {/* Interactive Decision Playground */}
                <Card className="bg-gradient-to-br from-primary-50 to-white border-2 border-primary-100">
                  <div className="flex items-center gap-2 mb-6">
                    <Settings className="w-5 h-5 text-primary-600" />
                    <Card.Title>Decision Playground</Card.Title>
                  </div>

                  <div className="space-y-5">
                    <Slider
                      label="Monthly Contribution"
                      value={params.monthlyNPSContribution}
                      min={1000}
                      max={100000}
                      step={500}
                      prefix="₹"
                      onChange={(val) => setParams({ ...params, monthlyNPSContribution: val })}
                    />
                    <Slider
                      label="Retirement Age"
                      value={params.retirementAge}
                      min={40}
                      max={70}
                      suffix=" Yrs"
                      onChange={(val) => setParams({ ...params, retirementAge: val })}
                    />
                    <Slider
                      label="Salary Growth"
                      value={params.expectedSalaryGrowth}
                      min={0}
                      max={20}
                      suffix="% p.a."
                      onChange={(val) => setParams({ ...params, expectedSalaryGrowth: val })}
                    />
                    <Slider
                      label="Inflation Rate"
                      value={params.inflationRate}
                      min={3}
                      max={10}
                      suffix="% p.a."
                      onChange={(val) => setParams({ ...params, inflationRate: val })}
                    />
                    <Slider
                      label="Annuity Purchase"
                      value={params.annuityPercentage}
                      min={40}
                      max={100}
                      suffix="%"
                      onChange={(val) => setParams({ ...params, annuityPercentage: val })}
                    />
                  </div>

                  <div className="mt-6 bg-white p-4 rounded-xl border border-primary-100 shadow-sm">
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-gray-500 font-medium">Estimated Corpus</span>
                      <span className="font-bold text-primary-600">{formatCurrency(results.totalCorpus, true)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">Monthly Pension</span>
                      <span className="font-bold text-green-600">{formatCurrency(results.monthlyPension)}</span>
                    </div>
                  </div>
                </Card>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="flex flex-col items-center gap-2 py-4 h-auto"
                    onClick={() => setActiveTab('scenarios')}
                  >
                    <Target className="w-5 h-5 text-primary-600" />
                    <span className="text-xs">Scenarios</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex flex-col items-center gap-2 py-4 h-auto"
                    onClick={() => setActiveTab('montecarlo')}
                  >
                    <BarChart3 className="w-5 h-5 text-primary-600" />
                    <span className="text-xs">Monte Carlo</span>
                  </Button>
                </div>

                {/* Trust & Transparency Panel */}
                <Card className="bg-gray-50 border-0">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-gray-600" />
                    <Card.Title className="text-base text-gray-700">Assumptions Used</Card.Title>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-500">Inflation</span>
                      <span className="font-semibold">{params.inflationRate}% p.a.</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-500">Expected Return</span>
                      <span className="font-semibold">{currentProjection.inputs.expectedReturn}% p.a.</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-500">Annuity Rate</span>
                      <span className="font-semibold">6.5% p.a.</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-500">Risk Profile</span>
                      <span className="font-semibold capitalize">{params.riskProfile}</span>
                    </div>
                  </div>
                </Card>

              </div>
            </motion.div>
          )}

          {/* Pension Simulator Tab */}
          {activeTab === 'simulator' && (
            <motion.div
              key="simulator"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <PensionSimulatorSection
                corpus={results.totalCorpus}
                pensionSimulation={pensionSimulation}
                params={params}
                setParams={setParams}
              />
            </motion.div>
          )}

          {/* Monte Carlo Tab */}
          {activeTab === 'montecarlo' && (
            <motion.div
              key="montecarlo"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <MonteCarloSection results={monteCarloResults} />
            </motion.div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <TimelineSection timeline={timeline} />
            </motion.div>
          )}

          {/* Family Protection Tab */}
          {activeTab === 'protection' && (
            <motion.div
              key="protection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <FamilyProtectionSection
                data={familyProtection}
                params={params}
                setParams={setParams}
                onRecalculate={async (stopAge) => {
                  const res = await projectionAPI.familyProtection({
                    ...params,
                    currentAge: params.age,
                    stopContributionAge: stopAge
                  });
                  if (res.data.success) {
                    setFamilyProtection(res.data.data);
                  }
                }}
              />
            </motion.div>
          )}

          {/* Scenarios Tab */}
          {activeTab === 'scenarios' && (
            <motion.div
              key="scenarios"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ScenariosQuickView />
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Floating AI Coach */}
      <motion.button
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4 rounded-2xl shadow-2xl shadow-primary-300 z-40 flex items-center gap-2 group hover:pr-6 transition-all"
        onClick={() => setShowAI(true)}
      >
        <MessageSquare className="w-6 h-6" />
        <span className="hidden group-hover:block font-bold text-sm whitespace-nowrap">Ask Coach</span>
      </motion.button>

      {/* AI Coach Sidebar */}
      <AICoach isOpen={showAI} onClose={() => setShowAI(false)} />
    </div>
  );
};

// NPS Pension Simulator Section
const PensionSimulatorSection = ({ corpus, pensionSimulation, params, setParams }) => {
  const [selectedAnnuity, setSelectedAnnuity] = useState(40);

  const selectedOption = pensionSimulation?.find(p => p.annuityPercentage === selectedAnnuity) || pensionSimulation?.[0];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">NPS Pension Simulator</h2>
        <p className="text-gray-500 text-sm mb-4 sm:mb-6">See how different annuity percentages affect your monthly pension</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Annuity Slider */}
          <div>
            <div className="bg-primary-50 rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
              <p className="text-sm font-medium text-primary-600 mb-1">Your Estimated Corpus</p>
              <p className="text-2xl sm:text-3xl font-bold text-primary-800">{formatCurrency(corpus)}</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Annuity Percentage: <span className="text-primary-600">{selectedAnnuity}%</span>
                </label>
                <input
                  type="range"
                  min="40"
                  max="100"
                  step="10"
                  value={selectedAnnuity}
                  onChange={(e) => setSelectedAnnuity(parseInt(e.target.value))}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span>40% (Min)</span>
                  <span>70%</span>
                  <span>100% (Max)</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">NPS Rule</p>
                <p className="text-sm text-gray-600">Minimum 40% of corpus must be used for annuity. Remaining can be withdrawn as lump sum (tax-free up to 60%).</p>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            {selectedOption && (
              <>
                <div className="bg-gradient-to-br from-green-500 to-green-700 text-white rounded-2xl p-4 sm:p-6">
                  <p className="text-green-100 text-sm font-medium mb-1">Monthly Pension</p>
                  <p className="text-3xl sm:text-4xl font-bold">{formatCurrency(selectedOption.monthlyPension)}</p>
                  <p className="text-green-200 text-sm mt-2">₹{(selectedOption.monthlyPension * 12).toLocaleString('en-IN')}/year</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-500 font-medium mb-1">Annuity Amount</p>
                    <p className="text-xl font-bold text-gray-800">{formatCurrency(selectedOption.annuityAmount, true)}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-500 font-medium mb-1">Lump Sum</p>
                    <p className="text-xl font-bold text-gray-800">{formatCurrency(selectedOption.lumpSum, true)}</p>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm text-blue-800">{selectedOption.description}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* All Options Comparison */}
        <div className="mt-8">
          <h3 className="font-bold text-gray-800 mb-4">Compare All Options</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Annuity %</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600">Monthly Pension</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600">Annuity Amount</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600">Lump Sum</th>
                </tr>
              </thead>
              <tbody>
                {pensionSimulation?.map((option, i) => (
                  <tr
                    key={i}
                    className={cn(
                      "border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors",
                      option.annuityPercentage === selectedAnnuity && "bg-primary-50"
                    )}
                    onClick={() => setSelectedAnnuity(option.annuityPercentage)}
                  >
                    <td className="py-3 px-4 font-medium">{option.annuityPercentage}%</td>
                    <td className="py-3 px-4 text-right font-bold text-green-600">{formatCurrency(option.monthlyPension)}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(option.annuityAmount, true)}</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(option.lumpSum, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Monte Carlo Section
const MonteCarloSection = ({ results }) => {
  if (!results) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mx-auto mb-4"></div>
          <div className="h-64 bg-gray-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  const chartData = [
    { name: 'Worst Case (P10)', value: results.percentiles.p10, color: '#DC2626' },
    { name: 'Pessimistic (P25)', value: results.percentiles.p25, color: '#F59E0B' },
    { name: 'Expected (P50)', value: results.percentiles.p50, color: '#2563EB' },
    { name: 'Optimistic (P75)', value: results.percentiles.p75, color: '#16A34A' },
    { name: 'Best Case (P90)', value: results.percentiles.p90, color: '#7C3AED' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">Monte Carlo Simulation</h2>
            <p className="text-gray-500 text-sm">1,000 market scenarios analyzed</p>
          </div>
          <div className="bg-primary-50 px-3 py-1.5 rounded-xl">
            <span className="text-xs sm:text-sm font-medium text-primary-600">
              {results.totalSimulations.toLocaleString()} simulations
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chart */}
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis
                  type="number"
                  tickFormatter={(value) => `₹${(value / 10000000).toFixed(1)}Cr`}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={80}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Scenarios */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {Object.entries(results.scenarios).map(([key, value], i) => (
                <div
                  key={key}
                  className={cn(
                    "p-4 rounded-xl border",
                    key === 'expected' ? "bg-primary-50 border-primary-200" : "bg-gray-50 border-gray-100"
                  )}
                >
                  <div className="flex justify-between items-center">
                    <span className="capitalize font-medium text-gray-700">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="font-bold text-lg">{formatCurrency(value, true)}</span>
                  </div>
                </div>
              ))}
            </div>

            {results.successProbability !== null && (
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-4">
                <p className="text-sm opacity-90">Probability of reaching your goal</p>
                <p className="text-3xl font-bold">{results.successProbability.toFixed(1)}%</p>
              </div>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-6 sm:mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 font-medium mb-1">Average</p>
            <p className="text-lg font-bold">{formatCurrency(results.statistics.mean, true)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 font-medium mb-1">Median</p>
            <p className="text-lg font-bold">{formatCurrency(results.statistics.median, true)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 font-medium mb-1">Minimum</p>
            <p className="text-lg font-bold">{formatCurrency(results.statistics.min, true)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 font-medium mb-1">Maximum</p>
            <p className="text-lg font-bold">{formatCurrency(results.statistics.max, true)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Timeline Section
const TimelineSection = ({ timeline }) => {
  if (!timeline) return null;

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
      <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Your Retirement Timeline</h2>
      <p className="text-gray-500 text-sm mb-6 sm:mb-8">A narrative journey of your financial future</p>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-600 via-primary-400 to-green-500"></div>

        <div className="space-y-8">
          {timeline.milestones?.map((milestone, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative flex gap-6 ml-0"
            >
              {/* Icon */}
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center text-2xl z-10 shadow-lg",
                milestone.type === 'start' ? "bg-primary-100" :
                  milestone.type === 'milestone' ? "bg-amber-100" :
                    milestone.type === 'warning' ? "bg-orange-100" :
                      milestone.type === 'end' ? "bg-green-100" : "bg-gray-100"
              )}>
                {milestone.icon}
              </div>

              {/* Content */}
              <div className={cn(
                "flex-1 p-5 rounded-2xl",
                milestone.type === 'start' ? "bg-primary-50 border border-primary-100" :
                  milestone.type === 'milestone' ? "bg-amber-50 border border-amber-100" :
                    milestone.type === 'warning' ? "bg-orange-50 border border-orange-100" :
                      milestone.type === 'end' ? "bg-green-50 border border-green-100" : "bg-gray-50 border border-gray-100"
              )}>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
                  <h3 className="font-bold text-gray-800">{milestone.title}</h3>
                  <span className="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full">
                    Age {milestone.age} • {milestone.year}
                  </span>
                </div>
                <p className="text-gray-600 mb-3">{milestone.description}</p>
                {milestone.corpus && (
                  <div className="flex gap-4">
                    <div className="bg-white rounded-lg px-3 py-2">
                      <span className="text-xs text-gray-500">Corpus</span>
                      <p className="font-bold text-primary-600">{formatCurrency(milestone.corpus, true)}</p>
                    </div>
                    {milestone.monthlyPension && (
                      <div className="bg-white rounded-lg px-3 py-2">
                        <span className="text-xs text-gray-500">Monthly Pension</span>
                        <p className="font-bold text-green-600">{formatCurrency(milestone.monthlyPension)}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Family Protection Section
const FamilyProtectionSection = ({ data, params, setParams, onRecalculate }) => {
  const [stopAge, setStopAge] = useState(params.age + 10);

  if (!data) return null;

  const chartData = [
    { type: 'Normal', corpus: data.normalScenario.corpus, pension: data.normalScenario.monthlyPension },
    { type: 'If Stopped', corpus: data.stoppedScenario.corpus, pension: data.stoppedScenario.monthlyPension },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="p-2.5 bg-red-100 rounded-xl flex-shrink-0">
            <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">Family Protection Mode</h2>
            <p className="text-gray-500 text-sm">What if you stop contributing today?</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <p className="text-sm sm:text-lg text-gray-800 font-medium">{data.message}</p>
        </div>

        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Stop contributions at age: <span className="text-primary-600">{stopAge}</span>
          </label>
          <input
            type="range"
            min={params.age + 1}
            max={params.retirementAge - 1}
            value={stopAge}
            onChange={(e) => {
              const newAge = parseInt(e.target.value);
              setStopAge(newAge);
              onRecalculate(newAge);
            }}
            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>Age {params.age + 1}</span>
            <span>Age {params.retirementAge - 1}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Comparison */}
          <div className="space-y-4">
            <div className="bg-green-50 rounded-xl p-5 border border-green-100">
              <p className="text-sm font-medium text-green-700 mb-2">✓ If You Continue Contributing</p>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-green-600">Final Corpus</p>
                  <p className="text-2xl font-bold text-green-800">{formatCurrency(data.normalScenario.corpus, true)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-green-600">Monthly Pension</p>
                  <p className="text-xl font-bold text-green-800">{formatCurrency(data.normalScenario.monthlyPension)}</p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 rounded-xl p-5 border border-red-100">
              <p className="text-sm font-medium text-red-700 mb-2">✗ If You Stop at Age {data.stoppedScenario.stopAge}</p>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-red-600">Final Corpus</p>
                  <p className="text-2xl font-bold text-red-800">{formatCurrency(data.stoppedScenario.corpus, true)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-red-600">Monthly Pension</p>
                  <p className="text-xl font-bold text-red-800">{formatCurrency(data.stoppedScenario.monthlyPension)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="type" axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(value) => `₹${(value / 10000000).toFixed(1)}Cr`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="corpus" name="Corpus" fill="#2563EB" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Impact Summary */}
        <div className="mt-6 sm:mt-8 grid grid-cols-3 gap-2 sm:gap-4">
          <div className="bg-gray-50 rounded-xl p-3 sm:p-4 text-center">
            <p className="text-[10px] xs:text-xs text-gray-500 font-medium mb-1">Corpus {data.impact.corpusReduction >= 0 ? 'Loss' : 'Gain'}</p>
            <p className={cn("text-sm xs:text-base sm:text-xl font-bold", data.impact.corpusReduction >= 0 ? "text-red-600" : "text-green-600")}>
              {data.impact.corpusReduction >= 0 ? '-' : '+'}{formatCurrency(Math.abs(data.impact.corpusReduction), true)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 sm:p-4 text-center">
            <p className="text-[10px] xs:text-xs text-gray-500 font-medium mb-1">Pension {data.impact.pensionReduction >= 0 ? 'Loss' : 'Gain'}</p>
            <p className={cn("text-sm xs:text-base sm:text-xl font-bold", data.impact.pensionReduction >= 0 ? "text-red-600" : "text-green-600")}>
              {data.impact.pensionReduction >= 0 ? '-' : '+'}{formatCurrency(Math.abs(data.impact.pensionReduction))}/mo
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 sm:p-4 text-center">
            <p className="text-[10px] xs:text-xs text-gray-500 font-medium mb-1">Total {data.impact.pensionReduction >= 0 ? 'Loss' : 'Impact'}</p>
            <p className={cn("text-sm xs:text-base sm:text-xl font-bold", data.impact.pensionReduction >= 0 ? "text-red-600" : "text-green-600")}>
              {data.impact.pensionReduction >= 0 ? '-' : ''}{Math.abs(data.impact.lossPercent ?? data.impact.reductionPercent)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Quick Scenarios View
const ScenariosQuickView = () => {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const res = await projectionAPI.getScenarios();
        if (res.data.success) {
          setScenarios(res.data.data.scenarios);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchScenarios();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
            <div className="h-12 w-12 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <div className="h-6 w-32 bg-gray-200 rounded mx-auto mb-2"></div>
            <div className="h-4 w-48 bg-gray-100 rounded mx-auto"></div>
          </div>
        ))}
      </div>
    );
  }

  const icons = [Clock, Target, Zap];

  return (
    <div className="space-y-6">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold">Scenario Comparison</h2>
        <p className="text-gray-500 text-sm">Compare different investment strategies side by side</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        {scenarios.map((scenario, index) => {
          const Icon = icons[index] || Target;
          return (
            <Card
              key={index}
              className={cn(
                "text-center h-full relative",
                scenario.name === 'Smart Investor' && "border-2 border-primary-500 ring-4 ring-primary-50"
              )}
            >
              {scenario.name === 'Smart Investor' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-widest">
                  Recommended
                </div>
              )}

              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4",
                index === 0 ? "bg-red-100 text-red-600" :
                  index === 1 ? "bg-primary-100 text-primary-600" :
                    "bg-green-100 text-green-600"
              )}>
                <Icon className="w-7 h-7" />
              </div>

              <h3 className="text-xl font-bold mb-2">{scenario.name}</h3>
              <p className="text-sm text-gray-500 mb-6">{scenario.description}</p>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-xs font-medium text-gray-500">Monthly SIP</span>
                  <span className="font-bold">{formatCurrency(scenario.parameters.monthlyContribution)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-xs font-medium text-gray-500">Retire At</span>
                  <span className="font-bold">{scenario.parameters.retirementAge} Years</span>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <p className="text-xs text-gray-500 font-medium mb-1">Expected Corpus</p>
                <p className="text-2xl font-bold text-primary-600">{formatCurrency(scenario.projection.results.totalCorpus, true)}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Pension: {formatCurrency(scenario.projection.results.monthlyPension)}/mo
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="text-center">
        <Button variant="outline" onClick={() => window.location.href = '/scenarios'}>
          View Detailed Comparison
          <ArrowUpRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;
