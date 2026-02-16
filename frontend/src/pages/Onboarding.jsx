import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/Button';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { cn, formatCurrency } from '../utils/helpers';
import { Send, Bot, User, ChevronRight, Sparkles, ShieldCheck, ArrowRight, Check } from 'lucide-react';

const Onboarding = () => {
  const [messages, setMessages] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickOptions, setShowQuickOptions] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    password: 'password123',
    age: null,
    monthlySalary: null,
    monthlyNPSContribution: null,
    retirementAge: 60,
    riskProfile: 'moderate',
    desiredMonthlyPension: 50000,
    existingSavings: 0,
    expectedSalaryGrowth: 8
  });
  
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const setAuth = useAuthStore((state) => state.setAuth);

  // Conversational flow steps
  const conversationFlow = [
    {
      id: 'welcome',
      botMessage: "Hey there! 👋 I'm your NPS Retirement Coach. I'll help you plan a secure financial future in just 60 seconds!",
      followUp: "Let's start - what should I call you?",
      field: 'name',
      placeholder: 'Type your name...',
      validate: (val) => val.trim().length >= 2,
      errorMsg: "Please enter your name (at least 2 characters)"
    },
    {
      id: 'email',
      botMessage: (data) => `Nice to meet you, ${data.name}! 🎉`,
      followUp: "What's your email address? (We'll use this to save your plan)",
      field: 'email',
      placeholder: 'yourname@email.com',
      validate: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      errorMsg: "Please enter a valid email address"
    },
    {
      id: 'age',
      botMessage: "Perfect! Now let's understand your current situation.",
      followUp: "How old are you?",
      field: 'age',
      placeholder: 'Enter your age (e.g., 28)',
      type: 'number',
      validate: (val) => parseInt(val) >= 18 && parseInt(val) <= 70,
      errorMsg: "Please enter an age between 18 and 70"
    },
    {
      id: 'salary',
      botMessage: (data) => `${parseInt(data.age) < 30 ? 'Great! You have time on your side 💪' : parseInt(data.age) < 40 ? 'Perfect timing to optimize your retirement plan! 📈' : 'No worries, it\'s never too late to start! 🌟'}`,
      followUp: "What's your monthly salary (in ₹)?",
      field: 'monthlySalary',
      placeholder: 'e.g., 50000',
      type: 'number',
      validate: (val) => parseInt(val) >= 10000,
      errorMsg: "Please enter your monthly salary (minimum ₹10,000)"
    },
    {
      id: 'contribution',
      botMessage: (data) => `${formatCurrency(parseInt(data.monthlySalary))}/month - that's a solid foundation! 💰`,
      followUp: "How much do you want to contribute to NPS monthly? (Recommended: 10-15% of salary)",
      field: 'monthlyNPSContribution',
      placeholder: `e.g., ${Math.round((userData.monthlySalary || 50000) * 0.1)}`,
      type: 'number',
      quickOptions: [
        { label: '10% of salary', getValue: (data) => Math.round((data.monthlySalary || 50000) * 0.1) },
        { label: '15% of salary', getValue: (data) => Math.round((data.monthlySalary || 50000) * 0.15) },
        { label: '20% of salary', getValue: (data) => Math.round((data.monthlySalary || 50000) * 0.2) }
      ],
      validate: (val) => parseInt(val) >= 500,
      errorMsg: "Minimum NPS contribution is ₹500/month"
    },
    {
      id: 'retirement',
      botMessage: (data) => `${formatCurrency(parseInt(data.monthlyNPSContribution))}/month is a great commitment! 🎯`,
      followUp: "At what age do you want to retire?",
      field: 'retirementAge',
      placeholder: 'e.g., 60',
      type: 'number',
      quickOptions: [
        { label: '55 - Early Retirement', value: 55 },
        { label: '60 - Standard', value: 60 },
        { label: '65 - Extended Career', value: 65 }
      ],
      validate: (val, data) => parseInt(val) >= 40 && parseInt(val) <= 70 && parseInt(val) > parseInt(data.age),
      errorMsg: "Retirement age must be between 40-70 and after your current age"
    },
    {
      id: 'risk',
      botMessage: (data) => {
        const years = parseInt(data.retirementAge) - parseInt(data.age);
        return `${years} years to retirement - ${years > 20 ? 'plenty of time to grow your wealth! 🚀' : years > 10 ? 'a great window for balanced growth! 📊' : 'let\'s make every year count! 💎'}`;
      },
      followUp: "What's your risk appetite for investments?",
      field: 'riskProfile',
      isChoice: true,
      choices: [
        { 
          value: 'conservative', 
          label: 'Conservative 🛡️', 
          description: 'Lower risk, stable returns (8-9% p.a.)',
          color: 'bg-blue-50 border-blue-200 text-blue-800'
        },
        { 
          value: 'moderate', 
          label: 'Moderate ⚖️', 
          description: 'Balanced risk & reward (10-11% p.a.)',
          color: 'bg-primary-50 border-primary-200 text-primary-800'
        },
        { 
          value: 'aggressive', 
          label: 'Aggressive 🚀', 
          description: 'Higher risk, higher potential (12-14% p.a.)',
          color: 'bg-orange-50 border-orange-200 text-orange-800'
        }
      ]
    },
    {
      id: 'pension_goal',
      botMessage: (data) => `${data.riskProfile === 'aggressive' ? 'Bold choice! Higher equity allocation can maximize long-term returns. 🎯' : data.riskProfile === 'conservative' ? 'Smart & steady wins the race! Stability is valuable. 🏆' : 'The balanced approach - best of both worlds! ⚖️'}`,
      followUp: "How much monthly pension do you want after retirement?",
      field: 'desiredMonthlyPension',
      placeholder: 'e.g., 50000',
      type: 'number',
      quickOptions: [
        { label: '₹30,000/month', value: 30000 },
        { label: '₹50,000/month', value: 50000 },
        { label: '₹75,000/month', value: 75000 },
        { label: '₹1,00,000/month', value: 100000 }
      ],
      validate: (val) => parseInt(val) >= 10000,
      errorMsg: "Please enter a pension goal (minimum ₹10,000/month)"
    },
    {
      id: 'existing',
      botMessage: (data) => `${formatCurrency(parseInt(data.desiredMonthlyPension))}/month - let's make it happen! 🎯`,
      followUp: "Do you have any existing NPS or retirement savings?",
      field: 'existingSavings',
      placeholder: 'Enter amount or 0 if none',
      type: 'number',
      quickOptions: [
        { label: 'Starting fresh (₹0)', value: 0 },
        { label: 'Under ₹1 Lakh', value: 50000 },
        { label: '₹1-5 Lakhs', value: 300000 },
        { label: 'Above ₹5 Lakhs', value: 500000 }
      ],
      validate: (val) => parseInt(val) >= 0,
      errorMsg: "Please enter a valid amount"
    }
  ];

  // Add initial message on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      addBotMessage(conversationFlow[0].botMessage, conversationFlow[0].followUp);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when typing stops
  useEffect(() => {
    if (!isTyping && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isTyping]);

  const addBotMessage = (message, followUp = null) => {
    setIsTyping(true);
    
    // First message
    setTimeout(() => {
      const msg = typeof message === 'function' ? message(userData) : message;
      setMessages(prev => [...prev, { type: 'bot', content: msg }]);
      
      // Follow-up message
      if (followUp) {
        setTimeout(() => {
          setMessages(prev => [...prev, { type: 'bot', content: followUp }]);
          setIsTyping(false);
          setShowQuickOptions(true);
        }, 800);
      } else {
        setIsTyping(false);
      }
    }, 600);
  };

  const addUserMessage = (content) => {
    setMessages(prev => [...prev, { type: 'user', content }]);
    setShowQuickOptions(false);
  };

  const processInput = async (value) => {
    const step = conversationFlow[currentStep];
    
    // Validate input
    if (step.validate && !step.validate(value, userData)) {
      setMessages(prev => [...prev, { type: 'bot', content: step.errorMsg, isError: true }]);
      return;
    }

    // Update user data
    const parsedValue = step.type === 'number' ? parseInt(value) : value;
    const newUserData = { ...userData, [step.field]: parsedValue };
    setUserData(newUserData);

    // Move to next step
    const nextStep = currentStep + 1;
    
    if (nextStep < conversationFlow.length) {
      setCurrentStep(nextStep);
      const nextFlow = conversationFlow[nextStep];
      addBotMessage(nextFlow.botMessage, nextFlow.followUp);
    } else {
      // All steps complete - submit
      await submitOnboarding(newUserData);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;
    
    addUserMessage(inputValue);
    processInput(inputValue);
    setInputValue('');
  };

  const handleQuickOption = (option) => {
    const value = typeof option.getValue === 'function' ? option.getValue(userData) : (option.value ?? option);
    addUserMessage(typeof option.label === 'string' ? option.label : formatCurrency(value));
    processInput(value.toString());
  };

  const handleChoiceSelect = (choice) => {
    addUserMessage(choice.label);
    processInput(choice.value);
  };

  const submitOnboarding = async (data) => {
    setLoading(true);
    setIsTyping(true);
    
    setMessages(prev => [...prev, { 
      type: 'bot', 
      content: "Amazing! Let me crunch some numbers and create your personalized retirement roadmap... 🧮✨" 
    }]);

    try {
      const response = await authAPI.register({
        ...data,
        password: 'password123'
      });
      
      if (response.data.success) {
        setAuth(response.data.data, response.data.data.token);
        localStorage.setItem('token', response.data.data.token);
        
        setTimeout(() => {
          setMessages(prev => [...prev, { 
            type: 'bot', 
            content: "Your retirement plan is ready! 🎉 Taking you to your personalized dashboard...",
            isSuccess: true
          }]);
          
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1500);
        }, 2000);
      }
    } catch (error) {
      console.error("Onboarding Error:", error);
      setMessages(prev => [...prev, { 
        type: 'bot', 
        content: "Oops! Something went wrong. Please try again.",
        isError: true
      }]);
      setIsTyping(false);
    }
  };

  const currentStepData = conversationFlow[currentStep];
  const progress = ((currentStep) / conversationFlow.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex flex-col">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary-600 to-primary-700 p-2 rounded-xl shadow-lg shadow-primary-200">
                <ShieldCheck className="text-white w-5 h-5" />
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                NPS Copilot
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-medium text-gray-500">60-second setup</span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-gray-500">Setting up your plan</span>
              <span className="text-xs font-bold text-primary-600">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </nav>

      {/* Chat Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "flex gap-3",
                    msg.type === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.type === 'bot' && (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shrink-0 shadow-lg shadow-primary-200">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}
                  
                  <div className={cn(
                    "max-w-[80%] px-4 py-3 rounded-2xl",
                    msg.type === 'user' 
                      ? "bg-primary-600 text-white rounded-br-sm" 
                      : msg.isError 
                        ? "bg-red-50 text-red-700 border border-red-100"
                        : msg.isSuccess
                          ? "bg-green-50 text-green-700 border border-green-100"
                          : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm shadow-sm"
                  )}>
                    <p className="text-[15px] leading-relaxed">{msg.content}</p>
                  </div>

                  {msg.type === 'user' && (
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing Indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm border border-gray-100 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={chatEndRef} />
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 bg-white/90 backdrop-blur-md border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4">
          
          {/* Quick Options */}
          {showQuickOptions && !isTyping && currentStepData?.quickOptions && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap gap-2 mb-4"
            >
              {currentStepData.quickOptions.map((option, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickOption(option)}
                  className="px-4 py-2 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-full text-sm font-medium transition-all hover:shadow-md border border-primary-100"
                >
                  {option.label}
                </button>
              ))}
            </motion.div>
          )}

          {/* Choice Options (for risk profile, etc.) */}
          {showQuickOptions && !isTyping && currentStepData?.isChoice && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4"
            >
              {currentStepData.choices.map((choice, i) => (
                <button
                  key={i}
                  onClick={() => handleChoiceSelect(choice)}
                  className={cn(
                    "p-4 rounded-2xl border-2 text-left transition-all hover:shadow-lg hover:scale-[1.02]",
                    choice.color
                  )}
                >
                  <p className="font-bold mb-1">{choice.label}</p>
                  <p className="text-xs opacity-80">{choice.description}</p>
                </button>
              ))}
            </motion.div>
          )}

          {/* Text Input */}
          {!currentStepData?.isChoice && (
            <form onSubmit={handleSubmit} className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type={currentStepData?.type || 'text'}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={currentStepData?.placeholder || 'Type your answer...'}
                  disabled={isTyping || loading}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-[15px]"
                />
              </div>
              <Button
                type="submit"
                disabled={!inputValue.trim() || isTyping || loading}
                className="px-6 py-4 rounded-2xl"
              >
                <Send className="w-5 h-5" />
              </Button>
            </form>
          )}

          {/* Helper Text */}
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-400">
            <Check className="w-3 h-3" />
            <span>Your data is encrypted and secure</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
