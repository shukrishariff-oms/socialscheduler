import { useState } from 'react';
import { Smartphone, Monitor, MoreHorizontal, ImageIcon, Heart, MessageCircle, Repeat, Share } from 'lucide-react';

const LivePreview = ({ newPost, currentPlatform }) => {
    const [previewDevice, setPreviewDevice] = useState('mobile');

    return (
        <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/50 dark:border-white/5 shadow-xl shadow-slate-200/50 dark:shadow-black/50 rounded-2xl overflow-hidden h-full flex flex-col transition-colors">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-1 bg-fuchsia-500 rounded-full"></div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Preview</h3>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                    <button onClick={() => setPreviewDevice('mobile')} className={`p-1.5 rounded-md ${previewDevice === 'mobile' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-400'}`}>
                        <Smartphone className="h-4 w-4" />
                    </button>
                    <button onClick={() => setPreviewDevice('desktop')} className={`p-1.5 rounded-md ${previewDevice === 'desktop' ? 'bg-white dark:bg-slate-700 shadow-sm' : 'text-slate-400'}`}>
                        <Monitor className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="flex-1 p-6 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-black/20 overflow-hidden relative">
                {/* Device Frame */}
                <div className={`transition-all duration-300 ${previewDevice === 'mobile' ? 'w-[320px]' : 'w-full max-w-[400px]'}`}>
                    <div className={`bg-white dark:bg-black border border-slate-200 dark:border-slate-800 ${previewDevice === 'mobile' ? 'rounded-[2.5rem] border-[8px] border-slate-900' : 'rounded-lg border'} shadow-2xl overflow-hidden`}>

                        {/* Status Bar (Mobile Only) */}
                        {previewDevice === 'mobile' && (
                            <div className="h-7 bg-black w-full flex justify-between items-center px-6">
                                <div className="w-16 h-4 bg-black rounded-b-xl absolute top-0 left-1/2 -translate-x-1/2 z-10"></div>
                                <span className="text-[10px] text-white font-medium">9:41</span>
                                <div className="flex gap-1">
                                    <div className="h-2 w-3 rounded-sm bg-white"></div>
                                </div>
                            </div>
                        )}

                        {/* Content Area */}
                        <div className={`p-4 ${previewDevice === 'mobile' ? 'min-h-[500px]' : 'min-h-[300px]'} bg-white dark:bg-black text-slate-900 dark:text-white`}>
                            {/* Post */}
                            <div className="flex items-start gap-3">
                                <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 flex-shrink-0"></div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold">Your Name</p>
                                            <p className="text-xs text-slate-500">@{currentPlatform.id === 'twitter' ? 'handle' : 'username'}</p>
                                        </div>
                                        <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                    </div>

                                    <div className="mt-2 space-y-3">
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                            {newPost.content || <span className="text-slate-300 dark:text-slate-700 italic">Start typing...</span>}
                                        </p>
                                        {newPost.media_url && (
                                            <div className="rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 aspect-video flex items-center justify-center relative">
                                                <img src={newPost.media_url} alt="Preview" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.classList.add('bg-slate-100') }} />
                                                <ImageIcon className="h-8 w-8 text-slate-300 dark:text-slate-700" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-4 flex items-center justify-between text-slate-400 dark:text-slate-600 max-w-[200px]">
                                        <Heart className="h-4 w-4" />
                                        <MessageCircle className="h-4 w-4" />
                                        <Repeat className="h-4 w-4" />
                                        <Share className="h-4 w-4" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LivePreview;
