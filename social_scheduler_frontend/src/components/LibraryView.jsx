import { motion } from 'framer-motion';
import { Upload, Image as ImageIcon, Film, MoreVertical, Search, Filter, History, Sparkles } from 'lucide-react';
import { useState } from 'react';

const LibraryView = () => {
    const [activeTab, setActiveTab] = useState('assets');

    const assets = [
        { id: 1, type: 'image', url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&q=80', name: 'Product Launch.jpg', size: '2.4 MB' },
        { id: 2, type: 'image', url: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=400&q=80', name: 'Team Meeting.jpg', size: '1.8 MB' },
        { id: 3, type: 'video', url: '', name: 'Demo Reel.mp4', size: '45.2 MB' },
        { id: 4, type: 'image', url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&q=80', name: 'Office Vibes.jpg', size: '3.1 MB' },
        { id: 5, type: 'image', url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&q=80', name: 'Analytics.png', size: '1.2 MB' },
    ];

    const historyItems = [
        { id: 1, source: 'Launch Day Blog', platforms: ['LinkedIn', 'Twitter'], date: '2 hours ago', tone: 'Professional' },
        { id: 2, source: 'Weekly Update', platforms: ['Threads'], date: 'Yesterday', tone: 'Conversational' },
    ];

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <ImageIcon className="text-fuchsia-500" />
                        Media Library
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400">Manage digital assets and AI history</p>
                </div>
                <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1">
                    <button
                        onClick={() => setActiveTab('assets')}
                        className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${activeTab === 'assets' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                        Assets
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                        <History className="h-3 w-3" />
                        AI History
                    </button>
                </div>
            </div>

            {activeTab === 'assets' ? (
                <>
                    {/* Toolbar */}
                    <div className="flex items-center justify-between bg-white dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-white/10 p-4 rounded-xl">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search assets..."
                                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-indigo-500/20">
                                <Upload className="h-4 w-4" />
                                Upload Asset
                            </button>
                        </div>
                    </div>

                    {/* Drag Drop Zone */}
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-12 flex flex-col items-center justify-center text-center hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/5 transition-all cursor-pointer group">
                        <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Upload className="h-8 w-8 text-slate-400 group-hover:text-indigo-500" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Drag & Drop files here</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">or click to browse your computer</p>
                    </div>

                    {/* Asset Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {assets.map((asset) => (
                            <motion.div
                                key={asset.id}
                                whileHover={{ y: -5 }}
                                className="group relative bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all cursor-pointer"
                            >
                                <div className="aspect-square bg-slate-100 dark:bg-slate-800 relative">
                                    {asset.type === 'image' ? (
                                        <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Film className="h-12 w-12 text-slate-400" />
                                        </div>
                                    )}

                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button className="p-2 bg-white/20 hover:bg-white/40 backdrop-blur rounded-lg text-white font-bold text-xs">
                                            Use
                                        </button>
                                    </div>
                                </div>
                                <div className="p-3">
                                    <div className="flex justify-between items-start">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate" title={asset.name}>{asset.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{asset.size}</p>
                                        </div>
                                        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                                            <MoreVertical className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Source Content</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Generated For</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Tone</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {historyItems.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{item.source}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            {item.platforms.map(p => (
                                                <span key={p} className="text-[10px] bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 px-2 py-1 rounded font-bold border border-indigo-100 dark:border-indigo-500/20">{p}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">{item.tone}</td>
                                    <td className="px-6 py-4 text-sm text-slate-500">{item.date}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-indigo-500 hover:text-indigo-600 font-bold text-xs flex items-center justify-end gap-1 w-full">
                                            <Sparkles className="h-3 w-3" /> Reuse
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default LibraryView;
