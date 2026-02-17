import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Smile, Zap, AlertCircle, Briefcase } from 'lucide-react';

const MoodMeter = ({ content }) => {
    const [mood, setMood] = useState('neutral');

    // Mock Sentiment Analysis Logic
    useEffect(() => {
        if (!content) {
            setMood('neutral');
            return;
        }

        const lower = content.toLowerCase();
        if (lower.includes('!') || lower.includes('amazing') || lower.includes('launch')) {
            setMood('excited');
        } else if (lower.includes('professional') || lower.includes('business') || lower.includes('growth')) {
            setMood('professional');
        } else if (lower.includes('hate') || lower.includes('bad') || lower.includes('angry')) {
            setMood('aggressive');
        } else {
            setMood('neutral');
        }
    }, [content]);

    const getMoodConfig = (m) => {
        switch (m) {
            case 'excited': return { label: 'Excited', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20' };
            case 'professional': return { label: 'Professional', icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20' };
            case 'aggressive': return { label: 'Aggressive', icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-100 dark:bg-rose-500/10', border: 'border-rose-200 dark:border-rose-500/20' };
            default: return { label: 'Neutral', icon: Smile, color: 'text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700' };
        }
    };

    const config = getMoodConfig(mood);
    const Icon = config.icon;

    return (
        <motion.div
            key={mood}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.bg} ${config.border}`}
        >
            <Icon className={`h-3.5 w-3.5 ${config.color}`} />
            <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
        </motion.div>
    );
};

export default MoodMeter;
