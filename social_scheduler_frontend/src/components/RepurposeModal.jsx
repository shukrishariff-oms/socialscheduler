import { motion, AnimatePresence } from 'framer-motion';
import { X, Wand2, Check, Copy, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { useState } from 'react';

const RepurposeModal = ({ isOpen, onClose, onApply }) => {
    const [input, setInput] = useState('');
    const [generating, setGenerating] = useState(false);
    const [results, setResults] = useState(null);

    const handleGenerate = () => {
        if (!input) return;
        setGenerating(true);

        // Mock AI Delay
        setTimeout(() => {
            const baseText = input.length > 50 ? input.substring(0, 50) + "..." : input;

            setResults([
                {
                    platform: 'Twitter / X',
                    content: `🚀 Just dropped: ${baseText}\n\nShort, punchy, and to the point. 👇\n\n#growth #tech #startup`,
                    confidence: 98,
                    tone: 'Punchy 🥊'
                },
                {
                    platform: 'Threads',
                    content: `🧵 Let's talk about ${baseText}\n\n1️⃣ It's a game changer.\n2️⃣ Here is why...\n3️⃣ What do you think?\n\n(Click to expand the thread) 🧶`,
                    confidence: 94,
                    tone: ' conversational 💬'
                },
                {
                    platform: 'LinkedIn',
                    content: `💡 Professional Update: ${baseText}\n\nIn today's fast-paced environment, consistency is key. Here are 3 takeaways:\n\n• Innovation drives growth.\n• Community matters.\n• Execution is everything.\n\nHow are you applying this in your role? let's discuss below. 👇\n\n#Professional #Leadership #Innovation`,
                    confidence: 89,
                    tone: 'Professional 👔'
                }
            ]);
            setGenerating(false);
        }, 1500);
    };

    const handleApply = (content) => {
        onApply(content);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/20">
                                <Wand2 className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Magic Content Factory</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Repurpose content for all platforms instantly</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {!results ? (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                        Source Content
                                    </label>
                                    <textarea
                                        className="w-full h-32 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4 text-sm focus:ring-2 focus:ring-purple-500 dark:text-white"
                                        placeholder="Paste a URL, a blog post, or a rough thought here..."
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        onClick={handleGenerate}
                                        disabled={!input || generating}
                                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 transition-all transform hover:scale-105 disabled:opacity-70 disabled:scale-100"
                                    >
                                        {generating ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Generating Magic...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="h-4 w-4" />
                                                Generate Multi-Platform Content
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {results.map((result, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="flex flex-col h-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden hover:border-purple-500/50 hover:shadow-lg transition-all group"
                                    >
                                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800">
                                            <span className="font-bold text-slate-900 dark:text-white text-sm">{result.platform}</span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-500/20">
                                                {result.confidence}% Match
                                            </span>
                                        </div>
                                        <div className="flex-1 p-4 relative">
                                            <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{result.content}</p>
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-1 rounded">{result.tone}</span>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-slate-100 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex gap-2">
                                            <button
                                                onClick={() => handleApply(result.content)}
                                                className="flex-1 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                            >
                                                Use This
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default RepurposeModal;
