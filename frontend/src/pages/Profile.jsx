import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, Mail, Calendar, Wallet, PiggyBank, Target, 
  Shield, TrendingUp, ArrowLeft, Save, Edit2, Check, LogOut,
  Home, BarChart2, Settings
} from 'lucide-react';
import Button from '../components/Button';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { formatCurrency } from '../utils/helpers';

const Profile = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
    monthlySalary: '',
    monthlyNPSContribution: '',
    retirementAge: '',
    riskProfile: 'moderate',
    desiredMonthlyPension: '',
    existingSavings: '',
    expectedSalaryGrowth: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        age: user.age?.toString() || '',
        monthlySalary: user.monthlySalary?.toString() || '',
        monthlyNPSContribution: user.monthlyNPSContribution?.toString() || '',
        retirementAge: user.retirementAge?.toString() || '60',
        riskProfile: user.riskProfile || 'moderate',
        desiredMonthlyPension: user.desiredMonthlyPension?.toString() || '',
        existingSavings: user.existingSavings?.toString() || '0',
        expectedSalaryGrowth: user.expectedSalaryGrowth?.toString() || '8'
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updateData = {
        name: formData.name,
        age: parseInt(formData.age),
        monthlySalary: parseInt(formData.monthlySalary),
        monthlyNPSContribution: parseInt(formData.monthlyNPSContribution),
        retirementAge: parseInt(formData.retirementAge),
        riskProfile: formData.riskProfile,
        desiredMonthlyPension: parseInt(formData.desiredMonthlyPension),
        existingSavings: parseInt(formData.existingSavings) || 0,
        expectedSalaryGrowth: parseInt(formData.expectedSalaryGrowth)
      };

      await authAPI.updateProfile(updateData);
      updateUser(updateData);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    localStorage.removeItem('token');
    navigate('/login');
  };

  const yearsToRetirement = parseInt(formData.retirementAge) - parseInt(formData.age);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">NPS Retirement Copilot</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                to="/dashboard" 
                className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
              >
                <Home className="w-5 h-5" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">My Profile</h2>
              <p className="text-gray-500 mt-1">Manage your retirement planning details</p>
            </div>
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Cancel
                </button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
          >
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm flex items-center gap-2"
          >
            <Check className="w-5 h-5" />
            {success}
          </motion.div>
        )}

        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 mb-8 text-white"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">{formData.name || 'User'}</h3>
              <p className="text-primary-100">{formData.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/20">
            <div>
              <p className="text-primary-200 text-sm">Age</p>
              <p className="text-xl font-semibold">{formData.age} years</p>
            </div>
            <div>
              <p className="text-primary-200 text-sm">Retirement In</p>
              <p className="text-xl font-semibold">{yearsToRetirement > 0 ? yearsToRetirement : 0} years</p>
            </div>
            <div>
              <p className="text-primary-200 text-sm">Monthly NPS</p>
              <p className="text-xl font-semibold">{formatCurrency(parseInt(formData.monthlyNPSContribution) || 0)}</p>
            </div>
            <div>
              <p className="text-primary-200 text-sm">Risk Profile</p>
              <p className="text-xl font-semibold capitalize">{formData.riskProfile}</p>
            </div>
          </div>
        </motion.div>

        {/* Profile Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary-600" />
              Personal Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{formData.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
                <p className="text-gray-900">{formData.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Current Age</label>
                {isEditing ? (
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    min="18"
                    max="70"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                ) : (
                  <p className="text-gray-900">{formData.age} years</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Financial Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary-600" />
              Financial Details
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Monthly Salary</label>
                {isEditing ? (
                  <input
                    type="number"
                    name="monthlySalary"
                    value={formData.monthlySalary}
                    onChange={handleChange}
                    min="10000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{formatCurrency(parseInt(formData.monthlySalary) || 0)}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Monthly NPS Contribution</label>
                {isEditing ? (
                  <input
                    type="number"
                    name="monthlyNPSContribution"
                    value={formData.monthlyNPSContribution}
                    onChange={handleChange}
                    min="500"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{formatCurrency(parseInt(formData.monthlyNPSContribution) || 0)}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Existing Savings</label>
                {isEditing ? (
                  <input
                    type="number"
                    name="existingSavings"
                    value={formData.existingSavings}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                ) : (
                  <p className="text-gray-900">{formatCurrency(parseInt(formData.existingSavings) || 0)}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Expected Salary Growth</label>
                {isEditing ? (
                  <input
                    type="number"
                    name="expectedSalaryGrowth"
                    value={formData.expectedSalaryGrowth}
                    onChange={handleChange}
                    min="0"
                    max="25"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                ) : (
                  <p className="text-gray-900">{formData.expectedSalaryGrowth}% per year</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Retirement Goals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary-600" />
              Retirement Goals
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Retirement Age</label>
                {isEditing ? (
                  <input
                    type="number"
                    name="retirementAge"
                    value={formData.retirementAge}
                    onChange={handleChange}
                    min="40"
                    max="70"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                ) : (
                  <p className="text-gray-900">{formData.retirementAge} years</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Desired Monthly Pension</label>
                {isEditing ? (
                  <input
                    type="number"
                    name="desiredMonthlyPension"
                    value={formData.desiredMonthlyPension}
                    onChange={handleChange}
                    min="10000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{formatCurrency(parseInt(formData.desiredMonthlyPension) || 0)}/month</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Risk Profile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary-600" />
              Investment Profile
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-3">Risk Tolerance</label>
              {isEditing ? (
                <div className="space-y-2">
                  {[
                    { value: 'conservative', label: 'Conservative 🛡️', desc: '8-9% p.a.', color: 'border-blue-200 bg-blue-50' },
                    { value: 'moderate', label: 'Moderate ⚖️', desc: '10-11% p.a.', color: 'border-primary-200 bg-primary-50' },
                    { value: 'aggressive', label: 'Aggressive 🚀', desc: '12-14% p.a.', color: 'border-orange-200 bg-orange-50' }
                  ].map((risk) => (
                    <label
                      key={risk.value}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.riskProfile === risk.value
                          ? risk.color
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="riskProfile"
                        value={risk.value}
                        checked={formData.riskProfile === risk.value}
                        onChange={handleChange}
                        className="w-4 h-4 text-primary-600"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{risk.label}</p>
                      </div>
                      <span className="text-sm text-gray-500">{risk.desc}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className={`p-4 rounded-lg ${
                  formData.riskProfile === 'conservative' ? 'bg-blue-50 border border-blue-200' :
                  formData.riskProfile === 'aggressive' ? 'bg-orange-50 border border-orange-200' :
                  'bg-primary-50 border border-primary-200'
                }`}>
                  <p className="font-semibold text-gray-900 capitalize">
                    {formData.riskProfile === 'conservative' && '🛡️ Conservative'}
                    {formData.riskProfile === 'moderate' && '⚖️ Moderate'}
                    {formData.riskProfile === 'aggressive' && '🚀 Aggressive'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {formData.riskProfile === 'conservative' && 'Lower risk, stable returns (8-9% p.a.)'}
                    {formData.riskProfile === 'moderate' && 'Balanced risk & reward (10-11% p.a.)'}
                    {formData.riskProfile === 'aggressive' && 'Higher risk, higher potential (12-14% p.a.)'}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex flex-wrap gap-4 justify-center"
        >
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            <BarChart2 className="w-5 h-5" />
            View Dashboard
          </Link>
          <Link
            to="/scenarios"
            className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            <TrendingUp className="w-5 h-5" />
            Explore Scenarios
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
