import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

const RegisterPage: React.FC = () => {
         const navigate = useNavigate();
         const [name, setName] = useState('');
         const [email, setEmail] = useState('');
         const [password, setPassword] = useState('');
         const [role, setRole] = useState<'customer' | 'agent'>('customer');
         const [loading, setLoading] = useState(false);
         const [error, setError] = useState<string | null>(null);
         const [success, setSuccess] = useState<string | null>(null);

         const handleSubmit = async (e: React.FormEvent) => {
                  e.preventDefault();
                  setError(null);
                  setSuccess(null);

                  if (!name || !email || !password) {
                           setError('Name, email, and password are required');
                           return;
                  }

                  setLoading(true);
                  try {
                           try {
                                    await api.post('/auth/register', { name, email, password, role });
                                    setSuccess('Account created successfully. Redirecting you to sign in...');
                                    // Redirect to login shortly after successful registration
                                    setTimeout(() => {
                                             navigate('/login');
                                    }, 1200);
                           } catch (err: any) {
                                    const message = err?.response?.data?.message || 'Registration failed. Please try again.';
                                    setError(message);
                           } finally {
                                    setLoading(false);
                           }
                  } catch (err: any) {
                           const message = err?.response?.data?.message || 'Registration failed. Please try again.';
                           setError(message);
                  } finally {
                           setLoading(false);
                  }
         };

         return (
                  <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-900">
                           <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-md">
                                    <h1 className="mb-4 text-xl font-semibold">Create your account</h1>
                                    {error && (
                                             <div className="mb-4 rounded border border-red-500 bg-red-100 px-3 py-2 text-sm text-red-500">
                                                      {error}
                                             </div>
                                    )}
                                    {success && (
                                             <div className="mb-4 rounded border border-emerald-500 bg-emerald-950 px-3 py-2 text-sm text-emerald-200">
                                                      {success}
                                             </div>
                                    )}
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                             <div className="space-y-1">
                                                      <label htmlFor="name" className="text-sm font-medium">
                                                               Name
                                                      </label>
                                                      <input
                                                               id="name"
                                                               type="text"
                                                               value={name}
                                                               onChange={(e) => setName(e.target.value)}
                                                               className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                                                      />
                                             </div>
                                             <div className="space-y-1">
                                                      <label htmlFor="email" className="text-sm font-medium">
                                                               Email
                                                      </label>
                                                      <input
                                                               id="email"
                                                               type="email"
                                                               value={email}
                                                               onChange={(e) => setEmail(e.target.value)}
                                                               className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                                                      />
                                             </div>
                                             <div className="space-y-1">
                                                      <label htmlFor="password" className="text-sm font-medium">
                                                               Password
                                                      </label>
                                                      <input
                                                               id="password"
                                                               type="password"
                                                               value={password}
                                                               onChange={(e) => setPassword(e.target.value)}
                                                               className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                                                      />
                                             </div>
                                             <div className="space-y-1">
                                                      <label htmlFor="role" className="text-sm font-medium">
                                                               Role
                                                      </label>
                                                      <select
                                                               id="role"
                                                               value={role}
                                                               onChange={(e) => setRole(e.target.value as 'customer' | 'agent')}
                                                               className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                                                      >
                                                               <option value="customer">Customer</option>
                                                               <option value="agent">Agent</option>
                                                      </select>
                                             </div>
                                             <button
                                                      type="submit"
                                                      disabled={loading}
                                                      className="mt-2 w-full rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                                             >
                                                      {loading ? 'Creating account...' : 'Sign up'}
                                             </button>
                                    </form>
                           </div>
                  </div>
         );
};

export default RegisterPage;
