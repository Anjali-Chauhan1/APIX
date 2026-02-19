import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Zap, Clock } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import { projectionAPI } from '../services/api';
import { formatCurrency, cn } from '../utils/helpers';

const Scenarios = () => {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    try {
      const response = await projectionAPI.getScenarios();
      setScenarios(response.data.data.scenarios);
    } catch (error) {
      console.error('Fetch Scenarios Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-12 h-12 bg-primary-200 rounded-full animate-bounce mb-4 mx-auto"></div>
        <p className="text-gray-500 font-medium tracking-tight">Modeling different futures...</p>
      </div>
    </div>
  );

  return (
    <div className="pb-20">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-6 sm:pt-8">

        <header className="mb-8 sm:mb-12">
          <h1 className="text-2xl xs:text-3xl sm:text-4xl font-black text-gray-900 mb-2">Scenario Comparison</h1>
          <p className="text-gray-500 text-sm sm:text-lg">See how different investment strategies affect your retirement life.</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
          {scenarios.map((scenario, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={cn(
                "h-full flex flex-col items-center text-center",
                scenario.name === 'Smart Investor' ? "border-2 border-primary-500 relative ring-4 ring-primary-50" : "border border-gray-100"
              )}>
                {scenario.name === 'Smart Investor' && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                    Recommended
                  </div>
                )}

                <div className={cn(
                  "p-4 rounded-3xl mb-6 shadow-sm",
                  index === 0 ? "bg-red-50 text-red-600" :
                    index === 1 ? "bg-primary-50 text-primary-600" :
                      "bg-success-50 text-success-600"
                )}>
                  {index === 0 ? <Clock className="w-8 h-8" /> :
                    index === 1 ? <Target className="w-8 h-8" /> :
                      <Zap className="w-8 h-8" />}
                </div>

                <h3 className="text-2xl font-black mb-2">{scenario.name}</h3>
                <p className="text-sm text-gray-500 mb-8 px-4 leading-relaxed">{scenario.description}</p>

                <div className="w-full space-y-4 mb-8">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">monthly</span>
                    <span className="font-black text-gray-900">{formatCurrency(scenario.parameters.monthlyContribution)}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">retiring at</span>
                    <span className="font-black text-gray-900">{scenario.parameters.retirementAge} Yrs</span>
                  </div>
                </div>

                <div className="mt-auto w-full pt-8 border-t border-gray-100 italic">
                  <div className="mb-2">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Expected Corpus</span>
                    <span className="text-2xl sm:text-3xl font-black text-primary-600">{formatCurrency(scenario.projection.results.totalCorpus, true)}</span>
                  </div>
                  <div>
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Monthly Pension</span>
                    <span className="text-xl font-black text-success-600">{formatCurrency(scenario.projection.results.monthlyPension)}</span>
                  </div>
                </div>

                <Button
                  variant={scenario.name === 'Smart Investor' ? 'primary' : 'outline'}
                  className="w-full mt-10"
                >
                  Adopt Plan
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Scenarios;
