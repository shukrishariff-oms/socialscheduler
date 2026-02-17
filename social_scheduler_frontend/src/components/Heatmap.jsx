import { motion } from 'framer-motion';

const Heatmap = ({ onTimeSelect }) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // Mock data generator for "best times"
    const getIntensity = (day, hour) => {
        // Weekdays 9-11am and 2-4pm are "hot"
        if (day < 5) {
            if ((hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16)) return 'high';
            if (hour >= 8 && hour <= 18) return 'medium';
        }
        // Weekends 11am-1pm
        if (day >= 5 && hour >= 11 && hour <= 13) return 'high';

        return 'low';
    };

    const getColor = (intensity) => {
        switch (intensity) {
            case 'high': return 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/50';
            case 'medium': return 'bg-emerald-500/40 hover:bg-emerald-500/60';
            default: return 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700';
        }
    };

    return (
        <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Best Time to Post
                </label>
                <div className="flex gap-2 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-emerald-500"></div> Best</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-slate-200 dark:bg-slate-800"></div> Poor</span>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl p-3 overflow-x-auto">
                <div className="min-w-[500px]">
                    {/* Hour Headers */}
                    <div className="grid grid-cols-[30px_repeat(24,1fr)] gap-1 mb-1">
                        <div />
                        {hours.map(h => (
                            <div key={h} className="text-[9px] text-center text-slate-400">
                                {h % 6 === 0 ? h : ''}
                            </div>
                        ))}
                    </div>

                    {/* Days Rows */}
                    {days.map((day, dayIdx) => (
                        <div key={day} className="grid grid-cols-[30px_repeat(24,1fr)] gap-1 mb-1">
                            <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 self-center">{day}</div>
                            {hours.map(hour => {
                                const intensity = getIntensity(dayIdx, hour);
                                return (
                                    <motion.button
                                        key={`${day}-${hour}`}
                                        whileHover={{ scale: 1.2 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => {
                                            // Calculate date for next occurrence of this day/hour
                                            // Mock implementation pass to parent
                                            onTimeSelect && onTimeSelect(day, hour);
                                        }}
                                        className={`h-5 w-full rounded-sm ${getColor(intensity)} transition-colors cursor-pointer`}
                                        title={`${day} ${hour}:00 - ${intensity === 'high' ? 'Great time!' : 'Okay time'}`}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Heatmap;
