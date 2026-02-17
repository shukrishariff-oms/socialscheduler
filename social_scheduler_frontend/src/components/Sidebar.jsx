import { motion } from 'framer-motion';
import { LayoutDashboard, Calendar, BarChart2, Settings, LogOut, Moon, Sun, Image as ImageIcon, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const Sidebar = ({ currentView, setCurrentView, darkMode, toggleDarkMode }) => {
    const [isHovered, setIsHovered] = useState(false);

    const menuItems = [
        { id: 'compose', icon: LayoutDashboard, label: 'Compose' },
        { id: 'calendar', icon: Calendar, label: 'Calendar' },
        { id: 'analytics', icon: BarChart2, label: 'Analytics' },
        { id: 'library', icon: ImageIcon, label: 'Library' },
        { id: 'settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <motion.div
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            animate={{ width: isHovered ? 240 : 80 }}
            className="h-screen bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200 dark:border-white/10 flex flex-col justify-between transition-colors duration-300 z-50 fixed left-0 top-0 shadow-2xl shadow-slate-200/50 dark:shadow-black/50"
        >
            {/* Logo Area */}
            <div className="h-20 flex items-center px-6 border-b border-slate-100 dark:border-white/5 overflow-hidden whitespace-nowrap">
                <div className="h-9 w-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
                    <LayoutDashboard className="h-5 w-5 text-white" />
                </div>
                <motion.span
                    animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -20 }}
                    className="ml-3 font-bold text-lg text-slate-900 dark:text-white"
                >
                    Social<span className="text-indigo-500">Cmd</span>
                </motion.span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 space-y-2 overflow-hidden">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setCurrentView(item.id)}
                            className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group relative whitespace-nowrap ${isActive
                                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                        >
                            <Icon className={`h-6 w-6 flex-shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'group-hover:text-slate-900 dark:group-hover:text-white'}`} />

                            <motion.span
                                animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
                                className={`ml-3 text-sm font-medium ${isActive ? 'font-bold' : ''}`}
                            >
                                {item.label}
                            </motion.span>

                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute left-0 w-1 h-8 bg-indigo-600 rounded-r-full"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                />
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-slate-100 dark:border-white/5 space-y-2 overflow-hidden whitespace-nowrap">
                <button
                    onClick={toggleDarkMode}
                    className="w-full flex items-center p-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                    {darkMode ? <Sun className="h-5 w-5 flex-shrink-0" /> : <Moon className="h-5 w-5 flex-shrink-0" />}
                    <motion.span
                        animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
                        className="ml-3 text-sm font-medium"
                    >
                        {darkMode ? 'Light Mode' : 'Dark Mode'}
                    </motion.span>
                </button>

                <button className="w-full flex items-center p-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-all">
                    <LogOut className="h-5 w-5 flex-shrink-0" />
                    <motion.span
                        animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
                        className="ml-3 text-sm font-medium"
                    >
                        Logout
                    </motion.span>
                </button>
            </div>

            {/* Expand Hint */}
            {!isHovered && (
                <div className="absolute top-1/2 -right-3 bg-white dark:bg-slate-800 rounded-full p-1 shadow-md border border-slate-100 dark:border-slate-700">
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                </div>
            )}
        </motion.div>
    );
};

export default Sidebar;
