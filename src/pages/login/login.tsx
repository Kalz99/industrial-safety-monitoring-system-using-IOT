import React from 'react';
import { useLogin } from '../../hooks/useLogin';
import { Mail, Lock, ShieldAlert, CheckCircle, Loader2 } from 'lucide-react';
import logo1 from '../../assets/logo1.png';

export const Login: React.FC = () => {
  const {
    email,
    setEmail,
    password,
    setPassword,
    error,
    success,
    loading,
    handleSubmit
  } = useLogin();

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-800 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Subtle Background Gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-rose-500/5 blur-[120px] pointer-events-none" />

      {/* Card container */}
      <div className="w-full max-w-md bg-white/70 backdrop-blur-2xl border border-white/50 rounded-[32px] p-8 md:p-10 shadow-[0_20px_50px_rgba(15,23,42,0.06)] relative z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-3 mb-8 text-center">
          <div className="h-20 w-20 flex items-center justify-center overflow-hidden rounded-2xl">
            <img src={logo1} alt="Logo" className="h-full w-full object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 uppercase">Industrial Safety Core</h1>
            <span className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase">Safety Live Analytics</span>
          </div>
        </div>

        {/* Success & Error alerts */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl mb-6 text-rose-600 text-sm animate-shake">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl mb-6 text-emerald-600 text-sm">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          {/* Email field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-450 uppercase tracking-wider ml-1" htmlFor="email-input">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
              <input
                id="email-input"
                type="email"
                required
                placeholder="supervisor@safety-core.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all duration-300"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-450 uppercase tracking-wider ml-1" htmlFor="password-input">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
              <input
                id="password-input"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all duration-300"
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-0 py-4 bg-blue-600 hover:bg-blue-550 active:scale-[0.98] disabled:opacity-50 text-white rounded-2xl text-sm font-normal shadow-md shadow-blue-500/10 cursor-pointer transition-all duration-300 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
