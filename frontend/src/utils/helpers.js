import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

/**
 * Format currency in Indian Rupees
 */
export function formatCurrency(amount, compact = false) {
    if (!amount && amount !== 0) return '₹0';

    if (compact) {
        if (amount >= 10000000) {
            return `₹${(amount / 10000000).toFixed(2)}Cr`;
        }
        if (amount >= 100000) {
            return `₹${(amount / 100000).toFixed(2)}L`;
        }
        if (amount >= 1000) {
            return `₹${(amount / 1000).toFixed(1)}K`;
        }
    }

    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
}

/**
 * Format number with Indian numbering system
 */
export function formatNumber(num) {
    return new Intl.NumberFormat('en-IN').format(num);
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value, total) {
    if (!total) return 0;
    return Math.round((value / total) * 100);
}

/**
 * Get risk level color
 */
export function getRiskColor(riskLevel) {
    const colors = {
        low: 'text-green-600 bg-green-100',
        moderate: 'text-orange-600 bg-orange-100',
        high: 'text-red-600 bg-red-100'
    };
    return colors[riskLevel] || colors.moderate;
}

/**
 * Get readiness score color
 */
export function getReadinessColor(score) {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
}

/**
 * Get readiness score background
 */
export function getReadinessBgColor(score) {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Format years
 */
export function formatYears(years) {
    if (years === 1) return '1 year';
    return `${years} years`;
}

/**
 * Validate email
 */
export function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Generate random ID
 */
export function generateId() {
    return Math.random().toString(36).substr(2, 9);
}
