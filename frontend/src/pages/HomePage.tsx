import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
         return (
                  <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200 text-slate-900">
                           {/* Hero */}
                           <section className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-16 md:flex-row md:items-center md:py-24">
                                    <div className="flex-1 space-y-6">
                                             <p className="text-xs uppercase tracking-[0.25em] text-indigo-400">AI-powered customer support</p>
                                             <h1 className="text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">
                                                      Turn every chat into a
                                                      <span className="block text-indigo-400">delightful customer experience.</span>
                                             </h1>
                                             <p className="max-w-xl text-sm text-slate-600 md:text-base">
                                                      Real-time chat between customers and agents, AI sentiment insights, smart reply suggestions,
                                                      and analytics in one modern support platform.
                                             </p>
                                             <div className="flex flex-wrap gap-3">
                                                      <Link
                                                               to="/login"
                                                               className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-500"
                                                      >
                                                               Sign in to Dashboard
                                                      </Link>
                                                      <Link
                                                               to="/register"
                                                               className="rounded border border-slate-200 px-4 py-2 text-sm font-medium text-slate-900 hover:border-indigo-500 hover:text-indigo-300"
                                                      >
                                                               Create an account
                                                      </Link>
                                             </div>
                                             <div className="mt-4 flex flex-wrap gap-6 text-xs text-slate-500 md:text-sm">
                                                      <div>
                                                               <p className="font-semibold text-slate-900">Real-time messaging</p>
                                                               <p>Low-latency chat built on Socket.IO and MongoDB.</p>
                                                      </div>
                                                      <div>
                                                               <p className="font-semibold text-slate-900">AI-assisted agents</p>
                                                               <p>Sentiment and reply suggestions keep teams fast.</p>
                                                      </div>
                                             </div>
                                    </div>
                                    <div className="flex-1">
                                             <div className="rounded-xl border border-slate-200 bg-white/90 p-4 shadow-lg">
                                                      <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
                                                               <span>Live Conversation</span>
                                                               <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-400">Live</span>
                                                      </div>
                                                      <div className="space-y-2 text-xs">
                                                               <div className="max-w-[80%] rounded bg-slate-100 px-3 py-2">
                                                                        <p className="text-[10px] uppercase text-slate-500">Customer</p>
                                                                        <p>Hi, I need help with my recent order.</p>
                                                               </div>
                                                               <div className="ml-auto max-w-[80%] rounded bg-indigo-600 px-3 py-2">
                                                                        <p className="text-[10px] uppercase text-slate-200">Agent · AI suggested</p>
                                                                        <p>Of course! Can you share your order ID so I can check the details?</p>
                                                               </div>
                                                               <div className="max-w-[80%] rounded bg-slate-100 px-3 py-2">
                                                                        <p className="text-[10px] uppercase text-slate-500">Customer</p>
                                                                        <p>It's #A9D27. I haven't received a confirmation email yet.</p>
                                                               </div>
                                                      </div>
                                                      <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-[11px] text-slate-500">
                                                               <span>Avg. response time: &lt; 1 min</span>
                                                               <span>Sentiment: <span className="text-amber-300">slightly negative</span></span>
                                                      </div>
                                             </div>
                                    </div>
                           </section>

                           {/* Steps / How it works */}
                           <section className="border-t border-slate-200 bg-white/80">
                                    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 md:flex-row">
                                             <div className="md:w-1/3">
                                                      <h2 className="text-lg font-semibold text-slate-900">How it works</h2>
                                                      <p className="mt-2 text-sm text-slate-600">
                                                               Get your team live with AI-powered support in minutes.
                                                      </p>
                                             </div>
                                             <ol className="flex flex-1 flex-col gap-4 text-sm text-slate-700 md:flex-row">
                                                      <li className="flex-1 rounded-lg border border-slate-200 bg-white p-4">
                                                               <p className="text-xs font-semibold uppercase tracking-wide text-indigo-400">Step 1</p>
                                                               <p className="mt-1 font-semibold">Create your account</p>
                                                               <p className="mt-1 text-xs text-slate-600">
                                                                        Register as a customer or agent, then sign in to your dashboard.
                                                               </p>
                                                      </li>
                                                      <li className="flex-1 rounded-lg border border-slate-200 bg-white p-4">
                                                               <p className="text-xs font-semibold uppercase tracking-wide text-indigo-400">Step 2</p>
                                                               <p className="mt-1 font-semibold">Start conversations</p>
                                                               <p className="mt-1 text-xs text-slate-600">
                                                                        Customers open chats from your website; agents manage them in real time.
                                                               </p>
                                                      </li>
                                                      <li className="flex-1 rounded-lg border border-slate-200 bg-white p-4">
                                                               <p className="text-xs font-semibold uppercase tracking-wide text-indigo-400">Step 3</p>
                                                               <p className="mt-1 font-semibold">Optimize with AI & analytics</p>
                                                               <p className="mt-1 text-xs text-slate-600">
                                                                        Use AI suggestions, sentiment, and analytics (in later milestones) to improve response quality.
                                                               </p>
                                                      </li>
                                             </ol>
                                    </div>
                           </section>

                           {/* Footer */}
                           <footer className="border-t border-slate-200 bg-white/95">
                                    <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 py-4 text-xs text-slate-500 md:flex-row">
                                             <span> {new Date().getFullYear()} AI Support Chat. All rights reserved.</span>
                                             <div className="flex gap-4">
                                                      <span className="hidden sm:inline">Built with MERN, TypeScript & Socket.IO</span>
                                                      <Link to="/login" className="text-indigo-400 hover:text-indigo-300">
                                                               Sign in
                                                      </Link>
                                                      <Link to="/register" className="text-indigo-400 hover:text-indigo-300">
                                                               Get started
                                                      </Link>
                                             </div>
                                    </div>
                           </footer>
                  </div>
         );
};

export default HomePage;
