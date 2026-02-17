import { Trash2, CheckCircle, AlertOctagon, Clock, History, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const PostQueue = ({ posts, handleDelete, getStatusBadge, platforms }) => {
    const [viewMode, setViewMode] = useState('upcoming'); // 'upcoming' or 'history'

    // Filter Logic
    const displayedPosts = posts.filter(post => {
        if (viewMode === 'upcoming') {
            return post.status === 'pending' || post.status === 'failed';
        } else {
            return post.status === 'published';
        }
    });

    return (
        <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/50 dark:border-white/5 shadow-xl shadow-slate-200/50 dark:shadow-black/50 rounded-2xl overflow-hidden flex flex-col h-full">
            <div className="px-6 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-1 bg-fuchsia-500 rounded-full"></div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Queue</h3>
                </div>

                {/* Toggle */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    <button
                        onClick={() => setViewMode('upcoming')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'upcoming'
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        <Calendar className="h-3 w-3" />
                        Upcoming
                    </button>
                    <button
                        onClick={() => setViewMode('history')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'history'
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        <History className="h-3 w-3" />
                        History
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                    {displayedPosts.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-12 text-slate-400 dark:text-slate-600"
                        >
                            <div className="mx-auto h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                                {viewMode === 'upcoming' ? <Calendar className="h-6 w-6" /> : <History className="h-6 w-6" />}
                            </div>
                            <p className="text-sm font-medium">No {viewMode} posts found.</p>
                        </motion.div>
                    ) : (
                        displayedPosts.map((post) => {
                            const platform = platforms.find(p => p.id === post.platform) || platforms[0]; // fallback
                            const Icon = platform.icon;

                            return (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    key={post.id}
                                    className={`group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 transition-all hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600 relative overflow-hidden ${viewMode === 'history' ? 'opacity-75 hover:opacity-100' : ''}`}
                                >
                                    {/* Status Indicator Bar */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${post.status === 'published' ? 'bg-emerald-500' :
                                            post.status === 'failed' ? 'bg-rose-500' : 'bg-sky-500'
                                        }`}></div>

                                    <div className="flex justify-between items-start mb-2 pl-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-lg ${viewMode === 'history' ? 'bg-slate-100 dark:bg-slate-700' : 'bg-slate-100 dark:bg-slate-700'} `}>
                                                <Icon className={`h-4 w-4 ${platform.color}`} />
                                            </div>
                                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 capitalize">
                                                {platform.name}
                                            </span>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 ${getStatusBadge(post.status)}`}>
                                            {post.status === 'published' && <CheckCircle className="h-3 w-3" />}
                                            {post.status === 'failed' && <AlertOctagon className="h-3 w-3" />}
                                            {post.status === 'pending' && <Clock className="h-3 w-3" />}
                                            {post.status}
                                        </span>
                                    </div>

                                    <div className="pl-2">
                                        <p className="text-sm text-slate-700 dark:text-slate-300 mb-3 line-clamp-2 font-medium leading-relaxed">
                                            {post.content}
                                        </p>

                                        <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-700/50">
                                            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                                {new Date(post.scheduled_at).toLocaleString([], {
                                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </span>

                                            {viewMode === 'upcoming' && (
                                                <button
                                                    onClick={() => handleDelete(post.id)}
                                                    className="text-slate-400 hover:text-rose-500 transition-colors p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-500/10"
                                                    title="Delete Post"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default PostQueue;
