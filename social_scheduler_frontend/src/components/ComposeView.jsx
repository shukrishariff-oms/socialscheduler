import { useState, useEffect } from 'react';
import { Send, ImageIcon, Clock, Sparkles, Wand2, Split, Trophy, Copy, Check, X, Link, AlertCircle, AlertTriangle } from 'lucide-react';
import Heatmap from './Heatmap';
import MoodMeter from './MoodMeter';
import RepurposeModal from './RepurposeModal';
import { motion, AnimatePresence } from 'framer-motion';

const ComposeView = ({
    newPost,
    setNewPost,
    handleSubmit,
    loading,
    platforms
}) => {
    const [aiMode, setAiMode] = useState('Professional');
    const [showAiMenu, setShowAiMenu] = useState(false);
    const [showRepurposeModal, setShowRepurposeModal] = useState(false);
    const [showShareToast, setShowShareToast] = useState(false);

    // Validation Logic
    const charCount = newPost.content.length;
    const failedPlatforms = [];
    let STRICTEST_LIMIT = 100000;

    // Calculate limits and failures
    if (newPost.platforms.length > 0) {
        newPost.platforms.forEach(platformId => {
            const platformDef = platforms.find(p => p.id === platformId);
            if (platformDef) {
                if (platformDef.limit < STRICTEST_LIMIT) STRICTEST_LIMIT = platformDef.limit;

                if (charCount > platformDef.limit) {
                    failedPlatforms.push({
                        name: platformDef.name,
                        limit: platformDef.limit
                    });
                }
            }
        });
    } else {
        STRICTEST_LIMIT = 0;
    }

    const isOverLimit = failedPlatforms.length > 0;

    // Construct Error Message
    const errorMessage = failedPlatforms.length > 0
        ? `Too long for ${failedPlatforms.map(p => p.name).join(', ')}`
        : '';

    // Toggle Platform Selection
    const togglePlatform = (id) => {
        const current = newPost.platforms;
        let updated;
        if (current.includes(id)) {
            updated = current.filter(p => p !== id);
        } else {
            updated = [...current, id];
        }
        setNewPost({ ...newPost, platforms: updated });
    };

    const getPlaceholder = () => {
        if (newPost.platforms.length === 0) return "Select a destination above...";
        const names = newPost.platforms.map(id => platforms.find(p => p.id === id)?.name).join(', ');
        return `What's happening on ${names}?`;
    };

    const generateAiContent = () => {
        let generated = newPost.content;
        if (!generated) generated = "Excited to share my latest project!";

        switch (aiMode) {
            case 'Viral': generated += " 🚀😱 Can you believe this? #viral #growth"; break;
            case 'Controversial': generated = "Unpopular opinion: " + generated + " Do you agree? 👇"; break;
            case 'Short & Punchy': generated = "Ship it. 🚀"; break;
            default: generated = "Thrilled to announce: " + generated + " #professional #business"; break;
        }
        setNewPost({ ...newPost, content: generated });
        setShowAiMenu(false);
    };

    return (
        <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/50 dark:border-white/5 shadow-xl shadow-slate-200/50 dark:shadow-black/50 rounded-2xl overflow-hidden transition-colors relative">

            <RepurposeModal
                isOpen={showRepurposeModal}
                onClose={() => setShowRepurposeModal(false)}
                onApply={(content) => setNewPost({ ...newPost, content })}
            />

            <div className="px-6 py-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-1 bg-indigo-500 rounded-full"></div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Compose</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowRepurposeModal(true)}
                            className="relative group p-[2px] rounded-xl overflow-hidden shadow-lg shadow-purple-500/20"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 animate-spin-slow opacity-100"></div>
                            <div className="relative bg-white dark:bg-slate-900 rounded-[10px] px-3 py-1.5 flex items-center gap-2 text-xs font-bold">
                                <Wand2 className="h-4 w-4 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500" />
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">Magic Factory</span>
                            </div>
                        </motion.button>
                        <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1"></div>
                        <MoodMeter content={newPost.content} />
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Manual Platform Selection */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Destinations</label>
                            <span className="text-[10px] font-medium text-slate-400">
                                {newPost.platforms.length} selected
                            </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {platforms.map((platform) => {
                                const Icon = platform.icon;
                                const isSelected = newPost.platforms.includes(platform.id);
                                return (
                                    <button
                                        key={platform.id}
                                        type="button"
                                        onClick={() => togglePlatform(platform.id)}
                                        className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-200 ${isSelected
                                                ? 'bg-indigo-50 dark:bg-indigo-500/20 border-indigo-500 ring-1 ring-indigo-500 shadow-sm'
                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100 hover:bg-slate-50 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        <Icon className={`h-5 w-5 mb-1 ${platform.color}`} />
                                        <span className={`text-[9px] font-medium truncate w-full text-center ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}>
                                            {platform.name}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Content Input Area */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Content
                            </label>

                            {/* Smart Counter & Validation Badge */}
                            <div className="flex items-center gap-3">
                                {isOverLimit && (
                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="flex items-center gap-1 text-xs font-bold text-rose-500 bg-rose-100 dark:bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-500/20"
                                    >
                                        <AlertTriangle className="h-3 w-3" />
                                        {errorMessage}
                                    </motion.div>
                                )}
                                <span className={`text-xs font-mono font-bold ${isOverLimit ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'}`}>
                                    {charCount} / {STRICTEST_LIMIT === 100000 || STRICTEST_LIMIT === 0 ? '∞' : STRICTEST_LIMIT}
                                </span>
                            </div>
                        </div>

                        <div className="relative group">
                            <textarea
                                required
                                className={`block w-full rounded-t-xl border-x border-t transition-all duration-300 p-4 pb-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-sm resize-none min-h-[160px] ${isOverLimit
                                        ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50 dark:bg-rose-500/5'
                                        : 'border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20 focus:border-indigo-500'
                                    }`}
                                placeholder={getPlaceholder()}
                                value={newPost.content}
                                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                            />
                        </div>

                        {/* Toolbar for AI & Actions (Attached below textarea) */}
                        <div className={`p-2 border-x border-b rounded-b-xl flex items-center justify-between transition-colors ${isOverLimit
                                ? 'bg-rose-50 dark:bg-rose-500/5 border-rose-500'
                                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                            }`}>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowAiMenu(!showAiMenu)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
                                    >
                                        <Wand2 className="h-3 w-3" />
                                        <span>{aiMode}</span>
                                    </button>
                                    {showAiMenu && (
                                        <div className="absolute top-full left-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-1 w-32 animate-in fade-in slide-in-from-top-2 z-10">
                                            {['Professional', 'Viral', 'Controversial', 'Short & Punchy'].map(mode => (
                                                <button
                                                    key={mode}
                                                    type="button"
                                                    onClick={() => setAiMode(mode)}
                                                    className={`w-full text-left px-2 py-1.5 text-xs rounded-md transition-colors ${aiMode === mode ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}
                                                >
                                                    {mode}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={generateAiContent}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold transition-colors border border-indigo-100 dark:border-indigo-500/20"
                                >
                                    <Sparkles className="h-3 w-3" />
                                    <span>Auto-Complete</span>
                                </button>
                            </div>

                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                Markdown Supported
                            </div>
                        </div>
                    </div>

                    {/* Media & Schedule */}
                    <div className="grid grid-cols-1 gap-4 pt-2">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Media URL</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <ImageIcon className="h-4 w-4 text-slate-400" />
                                </div>
                                <input
                                    type="url"
                                    className="block w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-sm transition duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-800"
                                    placeholder="https://example.com/image.png"
                                    value={newPost.media_url}
                                    onChange={(e) => setNewPost({ ...newPost, media_url: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Schedule Time</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Clock className="h-4 w-4 text-slate-400" />
                                </div>
                                <input
                                    type="datetime-local"
                                    required
                                    className="block w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 shadow-sm transition duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-800"
                                    value={newPost.scheduled_at}
                                    onChange={(e) => setNewPost({ ...newPost, scheduled_at: e.target.value })}
                                />
                            </div>

                            <Heatmap onTimeSelect={(d, h) => console.log('Selected', d, h)} />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                setShowShareToast(true);
                                setTimeout(() => setShowShareToast(false), 3000);
                            }}
                            className="flex-1 py-3 px-4 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            <Link className="h-4 w-4" />
                            Share
                        </button>
                        <button
                            type="submit"
                            disabled={loading || isOverLimit || newPost.platforms.length === 0}
                            className={`flex-[2] py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white transition-all duration-200 transform flex items-center justify-center gap-2 ${(isOverLimit || newPost.platforms.length === 0)
                                    ? 'bg-slate-400 cursor-not-allowed shadow-none'
                                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0'
                                }`}
                        >
                            {loading ? (
                                <span>Scheduling...</span>
                            ) : (
                                <>
                                    <Send className="h-4 w-4" />
                                    <span>Schedule Post</span>
                                </>
                            )}
                        </button>
                    </div>

                    <AnimatePresence>
                        {showShareToast && (
                            <motion.div
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 50, opacity: 0 }}
                                className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-xl z-50"
                            >
                                <Check className="h-3 w-3 text-emerald-400" />
                                Link copied to clipboard
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>
            </div>
        </div>
    );
};

export default ComposeView;
