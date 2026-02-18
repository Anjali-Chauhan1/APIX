import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileText, BarChart2, Share2, X, ChevronDown } from 'lucide-react';
import { cn } from '../utils/helpers';

// ─── helpers ────────────────────────────────────────────────────────────────

const useClickOutside = (ref, handler) => {
    useEffect(() => {
        const listener = (e) => {
            if (!ref.current || ref.current.contains(e.target)) return;
            handler(e);
        };
        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);
        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler]);
};

// ─── menu items ─────────────────────────────────────────────────────────────

const MENU_ITEMS = [
    {
        id: 'detailed',
        icon: FileText,
        label: 'Download Detailed Report',
        sublabel: 'Full analysis with charts & projections',
        iconBg: 'bg-blue-50',
        iconColor: 'text-blue-600',
        emoji: '📥',
    },
    {
        id: 'summary',
        icon: BarChart2,
        label: 'Download Summary',
        sublabel: 'One-page snapshot of your plan',
        iconBg: 'bg-violet-50',
        iconColor: 'text-violet-600',
        emoji: '📊',
    },
    {
        id: 'share',
        icon: Share2,
        label: 'Share Plan',
        sublabel: 'Copy a shareable link to your plan',
        iconBg: 'bg-emerald-50',
        iconColor: 'text-emerald-600',
        emoji: '🔗',
    },
];

// ─── action handlers ─────────────────────────────────────────────────────────

const handleAction = (id) => {
    switch (id) {
        case 'detailed':
            // Trigger detailed PDF download
            window.print();
            break;
        case 'summary':
            // Trigger summary download (placeholder)
            alert('Summary download coming soon!');
            break;
        case 'share': {
            const url = window.location.href;
            if (navigator.clipboard) {
                navigator.clipboard.writeText(url).then(() => {
                    alert('Link copied to clipboard! 🔗');
                });
            } else {
                prompt('Copy this link:', url);
            }
            break;
        }
        default:
            break;
    }
};

// ─── Desktop Dropdown ────────────────────────────────────────────────────────

const DesktopDropdown = ({ onClose }) => (
    <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.96 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl shadow-gray-200/80 border border-gray-100 overflow-hidden z-[100]"
    >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-50 bg-gradient-to-r from-primary-50 to-white">
            <p className="text-xs font-bold text-primary-600 uppercase tracking-widest">Export & Share</p>
        </div>

        {/* Items */}
        <div className="p-2">
            {MENU_ITEMS.map((item, i) => (
                <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => { handleAction(item.id); onClose(); }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-all group text-left"
                >
                    <div className={cn('p-2 rounded-xl flex-shrink-0 transition-transform group-hover:scale-110', item.iconBg)}>
                        <item.icon className={cn('w-4 h-4', item.iconColor)} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{item.label}</p>
                        <p className="text-xs text-gray-400 truncate">{item.sublabel}</p>
                    </div>
                </motion.button>
            ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-gray-50 bg-gray-50/50">
            <p className="text-[10px] text-gray-400 text-center font-medium">
                Reports are generated from your current plan data
            </p>
        </div>
    </motion.div>
);

// ─── Mobile Bottom Sheet ─────────────────────────────────────────────────────

const MobileBottomSheet = ({ onClose }) => (
    <>
        {/* Backdrop */}
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[90]"
        />

        {/* Sheet */}
        <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-[100] pb-safe"
        >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <div>
                    <p className="font-bold text-gray-900">Export & Share</p>
                    <p className="text-xs text-gray-400">Choose an option below</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <X className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            {/* Items */}
            <div className="p-4 space-y-2">
                {MENU_ITEMS.map((item, i) => (
                    <motion.button
                        key={item.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        onClick={() => { handleAction(item.id); onClose(); }}
                        className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl bg-gray-50 hover:bg-gray-100 active:scale-[0.98] transition-all text-left"
                    >
                        <div className={cn('p-3 rounded-xl flex-shrink-0', item.iconBg)}>
                            <item.icon className={cn('w-5 h-5', item.iconColor)} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-800">{item.label}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{item.sublabel}</p>
                        </div>
                        <span className="text-xl">{item.emoji}</span>
                    </motion.button>
                ))}
            </div>

            {/* Safe area spacer */}
            <div className="h-6" />
        </motion.div>
    </>
);

// ─── Main Component ──────────────────────────────────────────────────────────

const ExportDropdown = () => {
    const [open, setOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const containerRef = useRef(null);

    // Detect mobile
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // Close on outside click (desktop only)
    useClickOutside(containerRef, () => {
        if (!isMobile) setOpen(false);
    });

    // Lock body scroll when mobile sheet is open
    useEffect(() => {
        if (isMobile && open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isMobile, open]);

    return (
        <>
            {/* Trigger button */}
            <div ref={containerRef} className="relative">
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setOpen((v) => !v)}
                    className={cn(
                        'flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl font-semibold text-sm transition-all',
                        'bg-primary-600 text-white shadow-lg shadow-primary-200 hover:bg-primary-700 hover:shadow-primary-300',
                        open && 'bg-primary-700'
                    )}
                >
                    <Download className="w-4 h-4" />
                    <span className="hidden xs:inline">Export</span>
                    <motion.div
                        animate={{ rotate: open ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="hidden sm:block"
                    >
                        <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                    </motion.div>
                </motion.button>

                {/* Desktop dropdown */}
                {!isMobile && (
                    <AnimatePresence>
                        {open && <DesktopDropdown onClose={() => setOpen(false)} />}
                    </AnimatePresence>
                )}
            </div>

            {/* Mobile bottom sheet — rendered in a portal-like position */}
            {isMobile && (
                <AnimatePresence>
                    {open && <MobileBottomSheet onClose={() => setOpen(false)} />}
                </AnimatePresence>
            )}
        </>
    );
};

export default ExportDropdown;
