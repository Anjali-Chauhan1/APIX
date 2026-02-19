import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Mail, Lock, Calendar, Wallet, PiggyBank, Target,
  Shield, TrendingUp, ArrowRight, ArrowLeft, Check
} from 'lucide-react';
import Button from '../components/Button';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { formatCurrency } from '../utils/helpers';

const Signup = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    monthlySalary: '',
    monthlyNPSContribution: '',
    retirementAge: '60',
    riskProfile: 'moderate',
    desiredMonthlyPension: '',
    existingSavings: '0',
    expectedSalaryGrowth: '8'
  });

  const steps = [
    { id: 'account', title: 'Account Details', icon: User },
    { id: 'personal', title: 'Personal Info', icon: Calendar },
    { id: 'financial', title: 'Financial Details', icon: Wallet },
    { id: 'goals', title: 'Retirement Goals', icon: Target }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateStep = () => {
    switch (currentStep) {
      case 0:
        if (!formData.name || formData.name.length < 2) { setError('Please enter your name (at least 2 characters)'); return false; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { setError('Please enter a valid email address'); return false; }
        if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return false; }
        if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return false; }
        return true;
      case 1:
        const age = parseInt(formData.age);
        if (!age || age < 18 || age > 70) { setError('Please enter a valid age (18-70)'); return false; }
        return true;
      case 2:
        const salary = parseInt(formData.monthlySalary);
        const contribution = parseInt(formData.monthlyNPSContribution);
        if (!salary || salary < 10000) { setError('Please enter a valid monthly salary (minimum ₹10,000)'); return false; }
        if (!contribution || contribution < 500) { setError('Please enter NPS contribution (minimum ₹500)'); return false; }
        return true;
      case 3:
        const retAge = parseInt(formData.retirementAge);
        const pension = parseInt(formData.desiredMonthlyPension);
        if (!retAge || retAge <= parseInt(formData.age) || retAge > 70) { setError('Retirement age must be greater than current age and max 70'); return false; }
        if (!pension || pension < 10000) { setError('Please enter desired pension (minimum ₹10,000/month)'); return false; }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => { if (validateStep()) setCurrentStep(prev => Math.min(prev + 1, steps.length - 1)); };
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;
    setLoading(true);
    setError('');
    try {
      const submitData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        age: parseInt(formData.age),
        monthlySalary: parseInt(formData.monthlySalary),
        monthlyNPSContribution: parseInt(formData.monthlyNPSContribution),
        retirementAge: parseInt(formData.retirementAge),
        riskProfile: formData.riskProfile,
        desiredMonthlyPension: parseInt(formData.desiredMonthlyPension),
        existingSavings: parseInt(formData.existingSavings) || 0,
        expectedSalaryGrowth: parseInt(formData.expectedSalaryGrowth)
      };
      const response = await authAPI.register(submitData);
      const { data } = response.data;
      localStorage.setItem('token', data.token);
      setAuth(data, data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-sm";

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div key="account" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Enter your full name" className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Create a password (min 6 chars)" className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm your password" className={inputClass} />
              </div>
            </div>
          </motion.div>
        );

      case 1:
        return (
          <motion.div key="personal" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Age</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="number" name="age" value={formData.age} onChange={handleChange} placeholder="Enter your age (18-70)" min="18" max="70" className={inputClass} />
              </div>
              <p className="mt-1.5 text-xs text-gray-500">Your age helps us calculate the investment horizon.</p>
            </div>
            {formData.age && parseInt(formData.age) >= 18 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-primary-50 rounded-lg border border-primary-200">
                <p className="text-primary-800 text-sm">
                  {parseInt(formData.age) < 30 ? '🎉 Great! Starting early gives you a huge advantage.'
                    : parseInt(formData.age) < 40 ? '📈 Perfect timing! You have a solid window for wealth building.'
                      : parseInt(formData.age) < 50 ? '💪 Great time to optimize your retirement strategy.'
                        : '🌟 Every step counts! Let\'s maximize your retirement corpus.'}
                </p>
              </motion.div>
            )}
          </motion.div>
        );

      case 2:
        return (
          <motion.div key="financial" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Monthly Salary (₹)</label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="number" name="monthlySalary" value={formData.monthlySalary} onChange={handleChange} placeholder="e.g., 50000" min="10000" className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Monthly NPS Contribution (₹)</label>
              <div className="relative">
                <PiggyBank className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="number" name="monthlyNPSContribution" value={formData.monthlyNPSContribution} onChange={handleChange} placeholder="e.g., 5000" min="500" className={inputClass} />
              </div>
              {formData.monthlySalary && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[10, 15, 20].map((percent) => (
                    <button key={percent} type="button"
                      onClick={() => setFormData(prev => ({ ...prev, monthlyNPSContribution: Math.round(parseInt(prev.monthlySalary) * percent / 100).toString() }))}
                      className="px-2.5 py-1 text-xs bg-gray-100 hover:bg-primary-100 text-gray-700 hover:text-primary-700 rounded-full transition-colors">
                      {percent}% of salary
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Existing Savings (₹)</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="number" name="existingSavings" value={formData.existingSavings} onChange={handleChange} placeholder="Enter 0 if starting fresh" min="0" className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Expected Annual Salary Growth (%)</label>
              <div className="relative">
                <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="number" name="expectedSalaryGrowth" value={formData.expectedSalaryGrowth} onChange={handleChange} placeholder="e.g., 8" min="0" max="25" className={inputClass} />
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div key="goals" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Retirement Age</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="number" name="retirementAge" value={formData.retirementAge} onChange={handleChange} placeholder="e.g., 60" min="40" max="70" className={inputClass} />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[{ age: 55, label: '55 - Early' }, { age: 60, label: '60 - Standard' }, { age: 65, label: '65 - Extended' }].map(({ age, label }) => (
                  <button key={age} type="button"
                    onClick={() => setFormData(prev => ({ ...prev, retirementAge: age.toString() }))}
                    className={`px-2.5 py-1 text-xs rounded-full transition-colors ${formData.retirementAge === age.toString() ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-primary-100 hover:text-primary-700'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Desired Monthly Pension (₹)</label>
              <div className="relative">
                <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="number" name="desiredMonthlyPension" value={formData.desiredMonthlyPension} onChange={handleChange} placeholder="e.g., 50000" min="10000" className={inputClass} />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[30000, 50000, 75000, 100000].map((amt) => (
                  <button key={amt} type="button"
                    onClick={() => setFormData(prev => ({ ...prev, desiredMonthlyPension: amt.toString() }))}
                    className={`px-2.5 py-1 text-xs rounded-full transition-colors ${formData.desiredMonthlyPension === amt.toString() ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-primary-100 hover:text-primary-700'}`}>
                    {formatCurrency(amt)}/mo
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Risk Profile</label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { value: 'conservative', label: 'Conservative 🛡️', desc: 'Lower risk, stable returns (8-9% p.a.)', color: 'border-blue-200 bg-blue-50' },
                  { value: 'moderate', label: 'Moderate ⚖️', desc: 'Balanced risk & reward (10-11% p.a.)', color: 'border-primary-200 bg-primary-50' },
                  { value: 'aggressive', label: 'Aggressive 🚀', desc: 'Higher risk, higher potential (12-14% p.a.)', color: 'border-orange-200 bg-orange-50' }
                ].map((risk) => (
                  <label key={risk.value}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${formData.riskProfile === risk.value ? risk.color : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                    <input type="radio" name="riskProfile" value={risk.value} checked={formData.riskProfile === risk.value} onChange={handleChange} className="w-4 h-4 text-primary-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{risk.label}</p>
                      <p className="text-xs text-gray-500 truncate xs:whitespace-normal">{risk.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-green-50 flex">
      {/* Left Side - Branding (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">PensionSaarthi</h1>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">Start Your Retirement Journey</h2>
          <p className="text-primary-100 text-lg">Create your profile and get personalized retirement projections in minutes.</p>
        </div>
        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === index;
            const isCompleted = currentStep > index;
            return (
              <div key={step.id} className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isCompleted ? 'bg-green-500' : isActive ? 'bg-white' : 'bg-white/20'}`}>
                  {isCompleted ? <Check className="w-5 h-5 text-white" /> : <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-white'}`} />}
                </div>
                <p className={`font-medium ${isActive ? 'text-white' : 'text-primary-200'}`}>{step.title}</p>
              </div>
            );
          })}
        </div>
        <p className="text-primary-200 text-sm">© 2026 PensionSaarthi. All rights reserved.</p>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 xs:p-5 sm:p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          {/* Mobile header */}
          <div className="lg:hidden mb-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-primary-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary-600" />
              </div>
              <h1 className="text-base xs:text-lg font-bold text-gray-900">PensionSaarthi</h1>
            </div>
            {/* Mobile Progress Bar */}
            <div className="flex items-center gap-1.5">
              {steps.map((step, index) => (
                <div key={step.id} className={`flex-1 h-1.5 rounded-full ${currentStep >= index ? 'bg-primary-600' : 'bg-gray-200'}`} />
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-5 xs:p-6 sm:p-8 border border-gray-100">
            <div className="mb-5">
              <h2 className="text-xl xs:text-2xl font-bold text-gray-900">{steps[currentStep].title}</h2>
              <p className="text-gray-500 mt-1 text-sm">Step {currentStep + 1} of {steps.length}</p>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">{renderStepContent()}</AnimatePresence>

              <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-100">
                {currentStep > 0 ? (
                  <button type="button" onClick={prevStep}
                    className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                ) : <div />}

                {currentStep < steps.length - 1 ? (
                  <Button type="button" onClick={nextStep} className="flex items-center gap-1.5 text-sm py-2.5 px-4">
                    Continue <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={loading} className="flex items-center gap-1.5 text-sm py-2.5 px-4">
                    {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><span>Create Account</span><Check className="w-4 h-4" /></>}
                  </Button>
                )}
              </div>
            </form>

            <div className="mt-5 text-center">
              <p className="text-gray-600 text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">Sign in</Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;
