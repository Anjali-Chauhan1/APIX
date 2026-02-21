import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

// Custom 3D Bar shape
const ThreeDBar = (props) => {
  const { x, y, width, height, fill } = props;
  const depth = 10;
  return (
    <g>
      {/* Main bar */}
      <rect
        x={x}
        y={y}
        width={width - depth}
        height={height}
        rx={8}
        fill="#0000FF"
        style={{ filter: 'drop-shadow(2px 6px 12px rgba(0,0,255,0.25))', transition: 'all 0.3s' }}
      />
      {/* Right side for 3D effect */}
      <polygon
        points={`
          ${x + width - depth},${y}
          ${x + width},${y + depth}
          ${x + width},${y + height + depth}
          ${x + width - depth},${y + height}
        `}
        fill="#0000FF"
        opacity={0.22}
      />
      {/* Top highlight */}
      <rect
        x={x}
        y={y}
        width={width - depth}
        height={7}
        rx={8}
        fill="#e0e7ff"
        opacity={0.22}
      />
    </g>
  );
};

// Utility to format corpus value in ₹ Crores
const formatCorpus = (value) => {
  return `₹${(value / 1e7).toLocaleString('en-IN', { maximumFractionDigits: 2 })}Cr`;
};

// Tooltip component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white bg-opacity-80 backdrop-blur-md rounded-lg shadow-md p-3 border border-blue-100">
        <div className="font-semibold text-blue-700">Age: {label}</div>
        <div className="text-gray-700">Corpus: {`₹${payload[0].value.toLocaleString('en-IN')}`}</div>
      </div>
    );
  }
  return null;
};

const defaultConfig = {
  principal: 500000,
  rate: 0.12,
  monthly: 10000,
};

const ages = Array.from({ length: 41 }, (_, i) => 20 + i);

function generateData({ principal, rate, monthly }) {
  let corpus = principal;
  const data = [];
  for (let i = 0; i < ages.length; i++) {
    // Each year: add monthly contribution, then apply interest
    corpus += monthly * 12;
    corpus *= 1 + rate;
    data.push({
      age: ages[i],
      corpus: Math.round(corpus),
    });
  }
  return data;
}

const WealthGrowthProjection = () => {
  const [principal, setPrincipal] = useState(defaultConfig.principal);
  const [rate, setRate] = useState(defaultConfig.rate);
  const [monthly, setMonthly] = useState(defaultConfig.monthly);
  const [data, setData] = useState(() => generateData(defaultConfig));
  const [autoSim, setAutoSim] = useState(false);
  const intervalRef = useRef(null);

  // Animate chart on data change
  useEffect(() => {
    setData(generateData({ principal, rate, monthly }));
  }, [principal, rate, monthly]);

  // Auto simulation mode
  useEffect(() => {
    if (autoSim) {
      intervalRef.current = setInterval(() => {
        setPrincipal((p) => p * 1.002);
        setMonthly((m) => m * 1.001);
      }, 2000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [autoSim]);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="rounded-3xl shadow-xl bg-gradient-to-br from-white via-blue-50 to-blue-100 relative overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-start p-6">
          <div>
            <h2 className="text-2xl font-bold text-blue-900">Wealth Growth Projection</h2>
            <p className="text-blue-600 mt-1">Your corpus growth over time in 3D visualization</p>
          </div>
          <button
            className="flex items-center gap-2 bg-white bg-opacity-70 backdrop-blur-md px-4 py-2 rounded-full shadow border border-blue-200 transition hover:bg-blue-50"
            type="button"
          >
            <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
            <span className="text-blue-700 font-medium">Corpus Value</span>
          </button>
        </div>

        

        {/* Chart Container */}
        <div className="bg-white bg-opacity-60 backdrop-blur-lg rounded-2xl shadow-2xl p-6 m-6 mt-0 relative">
          <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(96,165,250,0.15) 100%)' }}></div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={data}
              margin={{ top: 30, right: 30, left: 0, bottom: 0 }}
              barCategoryGap={18}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#cfe2f3" />
              <XAxis
                dataKey="age"
                tick={{ fill: '#000', fontWeight: 700 }}
                axisLine={false}
                tickLine={false}
                label={{ value: 'Age', position: 'insideBottomRight', offset: -5, fill: '#000', fontWeight: 700 }}
              />
              <YAxis
                tickFormatter={formatCorpus}
                ticks={[0, 4e7, 8e7, 12e7, 16e7]}
                domain={[0, 16e7]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#000', fontWeight: 700 }}
                label={{ value: 'Corpus (₹)', angle: -90, position: 'insideLeft', fill: '#000', fontWeight: 700 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="corpus"
                fill="url(#blueGradient)"
                shape={<ThreeDBar />}
                isAnimationActive={true}
                animationDuration={500}
                animationEasing="ease-out"
              />
              <defs>
                <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0000FF" /> {/* Pure dark blue */}
                  <stop offset="100%" stopColor="#1e3a8a" /> {/* Slightly lighter for depth */}
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default WealthGrowthProjection;
