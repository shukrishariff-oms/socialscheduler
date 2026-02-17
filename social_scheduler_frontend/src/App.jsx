import { useState, useEffect, useRef } from 'react';
import { getPosts, createPost, deletePost } from './api';
import { Linkedin, Facebook, Twitter, AtSign, Search, Bell } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import ComposeView from './components/ComposeView';
import LivePreview from './components/LivePreview';
import PostQueue from './components/PostQueue';
import AnalyticsView from './components/AnalyticsView';
import LibraryView from './components/LibraryView';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({
    content: '',
    platforms: ['linkedin'],
    scheduled_at: '',
    media_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState('compose');
  const [darkMode, setDarkMode] = useState(true);
  const [syncAll, setSyncAll] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const prevPostsRef = useRef([]);

  // Load Posts & Init Dark Mode
  useEffect(() => {
    fetchPosts();
    // Auto-refresh stats every 10 seconds (Mock Real-Time)
    const interval = setInterval(() => {
      fetchPosts();
    }, 10000);

    if (darkMode) {
      document.documentElement.classList.add('dark');
    }
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const fetchPosts = async () => {
    try {
      const data = await getPosts();

      // Check for status changes to trigger notifications
      const prevPosts = prevPostsRef.current;
      if (prevPosts.length > 0) {
        data.forEach(newPost => {
          const oldPost = prevPosts.find(p => p.id === newPost.id);
          if (oldPost && oldPost.status === 'pending' && newPost.status === 'published') {
            const platformName = platforms.find(p => p.id === newPost.platform)?.name || newPost.platform;
            toast.success(`Post published to ${platformName}!`, {
              duration: 5000,
              position: 'bottom-right',
              style: {
                background: '#10b981',
                color: '#fff',
                fontWeight: 'bold',
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#10b981',
              },
            });
          }
        });
      }

      prevPostsRef.current = data;
      setPosts(data);
    } catch (error) {
      console.error("Failed to fetch posts", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const isoDate = new Date(newPost.scheduled_at).toISOString();
      // Map selected platforms to payload
      const payload = newPost.platforms.map(platformId => ({
        content: newPost.content,
        platform: platformId,
        scheduled_at: isoDate,
        media_url: newPost.media_url,
        status: 'pending'
      }));

      await createPost(payload);

      setNewPost({ content: '', platforms: ['linkedin'], scheduled_at: '', media_url: '' });
      fetchPosts();
      toast.success('Posts scheduled successfully!', {
        style: {
          background: '#333',
          color: '#fff',
        },
      });
    } catch (error) {
      console.error("Failed to create post", error);
      let errorMsg = "Failed to create post";
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (Array.isArray(detail)) {
          errorMsg = detail.map(e => e.msg).join(', ');
        } else if (typeof detail === 'object') {
          errorMsg = JSON.stringify(detail);
        } else {
          errorMsg = String(detail);
        }
      }
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await deletePost(id);
      fetchPosts();
    } catch (error) {
      console.error("Failed to delete post", error);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published': return 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30';
      case 'failed': return 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30';
      case 'pending': return 'bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-500/30';
      default: return 'bg-slate-100 dark:bg-slate-700/50 text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-600';
    }
  };

  const platforms = [
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'text-blue-700 dark:text-blue-400', limit: 3000 },
    { id: 'twitter', name: 'X (Twitter)', icon: Twitter, color: 'text-black dark:text-white', limit: 280 },
    { id: 'threads', name: 'Threads', icon: AtSign, color: 'text-black dark:text-white', limit: 500 },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-600 dark:text-blue-400', limit: 63206 },
  ];

  // Smart Sync Logic
  const currentPlatform = platforms.find(p => p.id === newPost.platform) || platforms[0];
  let displayPost = { ...newPost };

  if (syncAll && currentPlatform.id === 'twitter' && newPost.content.length > 280) {
    displayPost.content = newPost.content.substring(0, 280);
  } else if (syncAll && currentPlatform.id === 'threads' && newPost.content.length > 500) {
    displayPost.content = newPost.content.substring(0, 500);
  }

  const charCount = newPost.content.length;
  const isOverLimit = charCount > currentPlatform.limit && !syncAll;

  // Global Search Logic (Filter Queue)
  const filteredPosts = posts.filter(p => p.content.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className={`flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300 selection:bg-cyan-500/30 selection:text-cyan-200`}>

      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        darkMode={darkMode}
        toggleDarkMode={() => setDarkMode(!darkMode)}
      />

      <Toaster />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen relative ml-[80px]">
        {/* Background Glows */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-indigo-500/10 dark:bg-indigo-500/5 blur-[100px] pointer-events-none"></div>

        <div className="max-w-[1700px] mx-auto py-8 px-4 sm:px-6 lg:px-8 relative z-10">

          {/* Global Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 lg:block hidden">
              {currentView.charAt(0).toUpperCase() + currentView.slice(1)}
            </h1>

            <div className="flex-1 max-w-xl mx-auto px-8 relative z-50">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Type / to search everywhere..."
                  className="w-full bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm dark:text-white placeholder:text-slate-400 shadow-lg shadow-slate-200/20 dark:shadow-black/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden md:block">
                  <kbd className="inline-flex items-center border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 rounded px-2 text-[10px] font-sans font-medium text-slate-500 dark:text-slate-400">Ctrl K</kbd>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>
              </button>
              <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800"></div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Admin User</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Pro Plan</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 shadow-lg shadow-indigo-500/20"></div>
              </div>
            </div>
          </div>

          {/* Dynamic Views */}
          {currentView === 'compose' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4">
                <ComposeView
                  newPost={newPost}
                  setNewPost={setNewPost}
                  handleSubmit={handleSubmit}
                  loading={loading}
                  platforms={platforms}
                  charCount={charCount}
                  isOverLimit={isOverLimit}
                  currentPlatform={currentPlatform}
                  syncAll={syncAll}
                  setSyncAll={setSyncAll}
                />
              </div>
              <div className="lg:col-span-4">
                <LivePreview newPost={displayPost} currentPlatform={currentPlatform} />
              </div>
              <div className="lg:col-span-4">
                <PostQueue
                  posts={filteredPosts}
                  handleDelete={handleDelete}
                  getStatusBadge={getStatusBadge}
                  platforms={platforms}
                />
              </div>
            </div>
          )}

          {currentView === 'analytics' && <AnalyticsView />}

          {currentView === 'library' && <LibraryView />}

          {currentView === 'calendar' && (
            <div className="flex items-center justify-center h-[500px] bg-white/50 dark:bg-slate-900/50 backdrop-blur border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
              <div className="text-center text-slate-500 dark:text-slate-400">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                <h3 className="text-xl font-bold mb-2">Calendar View</h3>
                <p>Coming Soon in Phase 5</p>
              </div>
            </div>
          )}

          {currentView === 'settings' && (
            <div className="flex items-center justify-center h-[500px] bg-white/50 dark:bg-slate-900/50 backdrop-blur border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
              <div className="text-center text-slate-500 dark:text-slate-400">
                <h3 className="text-xl font-bold mb-2">Settings</h3>
                <p>Coming Soon</p>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

export default App
