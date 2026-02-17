import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { motion, useSpring, useTransform, animate } from 'framer-motion';
import { TrendingUp, Users, Eye, Share2, Activity, DollarSign, Download, Info } from 'lucide-react';
import { useEffect, useState } from 'react';

const NumberTicker = ({ value }) => {
    const numericValue = parseFloat(value.replace(/[^0-9.-]+/g, ""));
    const isCurrency = value.includes('$');
    const isK = value.includes('k');
    const isM = value.includes('M');

    // Determine the actual number to count to
    let target = numericValue;
    if (isK) target *= 1000;
    if (isM) target *= 1000000;

    const spring = useSpring(0, { bounce: 0, duration: 2000 });
    const display = useTransform(spring, (current) => {
        if (isCurrency) return `$${current.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (current >= 1000000) return `${(current / 1000000).toFixed(1)}M`;
        if (current >= 1000) return `${(current / 1000).toFixed(1)}k`;
        return current.toFixed(0);
    });

    useEffect(() => {
        spring.set(target);
    }, [spring, target]);

    return <motion.span>{display}</motion.span>;
};

const AnalyticsView = () => {
    // Mock Data for Engagement
    const data = [
        { name: 'Mon', actual: 4000, predicted: 4200 },
        { name: 'Tue', actual: 3000, predicted: 3500 },
        { name: 'Wed', actual: 2000, predicted: 4800 },
        { name: 'Thu', actual: 2780, predicted: 3908 },
        { name: 'Fri', actual: 1890, predicted: 4800 },
        { name: 'Sat', actual: 2390, predicted: 3800 },
        { name: 'Sun', actual: 3490, predicted: 4300 },
    ];

    const topPosts = [
        { id: 1, content: "Launch day is here! 🚀 #startup", virality: 98, views: '12.5k' },
        { id: 2, content: "5 tips for better React code...", virality: 85, views: '8.2k' },
        { id: 3, content: "Why I switched to Vim.", virality: 72, views: '5.1k' },
    ];

    // Mock Calculation for EMV
    const totalReach = 1200000; // 1.2M
    const emv = totalReach * 0.05; // $60,000

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Activity className="text-cyan-500" />
                        Performance Command Center
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400">Real-time insights and revenue intelligence</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors border border-slate-700">
                        <Download className="h-4 w-4" />
                        Export Executive Report
                    </button>
                    <span className="px-3 py-2 rounded-full bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 text-xs font-bold flex items-center">
                        <div className="w-2 h-2 rounded-full bg-cyan-500 mr-2 animate-pulse"></div>
                        Live Data
                    </span>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {[
                    { label: 'Total Reach', value: '1.2M', change: '+12%', icon: Eye, color: 'text-cyan-500' },
                    { label: 'Engagement', value: '85.4k', change: '+5%', icon: Users, color: 'text-purple-500' },
                    { label: 'Shares', value: '24.1k', change: '+18%', icon: Share2, color: 'text-emerald-500' },
                    { label: 'Virality Score', value: '92.0', change: '+2%', icon: TrendingUp, color: 'text-rose-500', tooltip: "High due to trending hashtags" },
                    { label: 'Est. Media Value', value: `$${emv.toLocaleString()}`, change: '+8%', icon: DollarSign, color: 'text-amber-500', isCurrency: true },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ y: -5 }}
                        className="bg-white dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-lg relative group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-800 ${stat.color}`}>
                                <stat.icon className="h-6 w-6" />
                            </div>
                            <span className="text-emerald-500 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded-full">{stat.change}</span>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                            <NumberTicker value={stat.value} />
                        </h3>
                        <div className="flex items-center gap-1">
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">{stat.label}</p>
                            {stat.tooltip && (
                                <div className="relative group/tooltip">
                                    <Info className="h-3 w-3 text-slate-400 cursor-help" />
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                        {stat.tooltip}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-lg">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Engagement Forecast</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                                    itemStyle={{ fontSize: '12px' }}
                                />
                                <Area type="monotone" dataKey="actual" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorActual)" />
                                <Area type="monotone" dataKey="predicted" stroke="#06b6d4" strokeWidth={3} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorPredicted)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Content */}
                <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-lg">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Top Content</h3>
                    <div className="space-y-4">
                        {topPosts.map((post, i) => (
                            <motion.div
                                key={i}
                                animate={i === 0 ? { scale: [1, 1.02, 1], boxShadow: ["0 0 0 rgba(79, 70, 229, 0)", "0 0 20px rgba(79, 70, 229, 0.3)", "0 0 0 rgba(79, 70, 229, 0)"] } : {}}
                                transition={i === 0 ? { duration: 2, repeat: Infinity } : {}}
                                className={`flex items-center gap-4 p-3 rounded-xl transition-colors border border-transparent ${i === 0 ? 'bg-indigo-500/10 border-indigo-500/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-200 dark:hover:border-slate-700'}`}
                            >
                                <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0 ${i === 0 ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                                    #{post.id}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-slate-900 dark:text-white font-medium truncate">{post.content}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-slate-500">{post.views} views</span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">Virality: {post.virality}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    <button className="mt-6 w-full py-2 text-sm text-indigo-500 font-bold hover:text-indigo-400 transition-colors">
                        View All Posts
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsView;
