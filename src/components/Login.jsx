import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../context/AuthContext";
import logo from "./../../public/logo3.jpg";
import Tooltip from "./Tooltip";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const success = await login(email, password);
      if (success) {
        navigate("/");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="lg:h-screen lg:overflow-hidden min-h-screen bg-slate-900 flex lg:flex-row flex-col relative font-sans">
      
      {/* 1. Left Section: Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative h-full border-r border-white/5 overflow-hidden bg-slate-950/20">
        <div className="absolute inset-0 z-0">
          <motion.div 
            animate={{ scale: [1, 1.3, 1], rotate: [0, 90, 0], x: [0, 50, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-[10%] -left-[10%] w-[600px] h-[600px] bg-purple-500/20 blur-[120px] rounded-full"
          />
          <motion.div 
            animate={{ scale: [1.3, 1, 1.3], x: [0, -70, 0], y: [0, 50, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-[10%] -right-[10%] w-[500px] h-[500px] bg-blue-500/15 blur-[100px] rounded-full"
          />
        </div>

        <div className="relative z-10 flex items-center justify-center w-full px-12">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="backdrop-blur-3xl bg-white/[0.03] p-12 rounded-[3.5rem] border border-white/10 shadow-2xl text-center max-w-sm relative group"
          >
            <div className="mb-6 relative inline-block">
              <div className="absolute -inset-8 bg-purple-500/20 blur-3xl rounded-full" />
              <img src={logo} alt="Logo" className="w-28 h-28 rounded-3xl shadow-2xl border border-white/10 relative z-10 transform -rotate-6 group-hover:rotate-0 transition-transform duration-700" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-tight mb-3">
              The Ultimate <br /> <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Songs</span>
            </h1>
            <p className="text-zinc-400 text-[10px] font-bold tracking-[0.2em] uppercase opacity-70">Your premium music universe</p>
          </motion.div>
        </div>
      </div>

      {/* 2. Right Section: Form */}
      <div className="flex-1 flex flex-col relative z-20 h-full overflow-y-auto lg:overflow-visible">
        <div className="p-3 lg:p-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-zinc-500 hover:text-white transition-all group">
            <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-purple-500 transition-all font-bold"><i className="ri-arrow-left-line text-sm"></i></div>
            <span className="font-bold text-[8px] tracking-[0.2em] uppercase opacity-60">Return Home</span>
          </Link>
          <img src={logo} alt="Logo" className="w-8 h-8 rounded-lg lg:hidden" />
        </div>

        <div className="flex-1 flex items-center justify-center px-6 lg:px-14 pb-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
            <div className="mb-2 text-left">
              <h2 className="text-4xl font-black text-white mb-1 tracking-tighter uppercase italic">Welcome Back</h2>
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] opacity-50">Sync with the cloud</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-2.5">
              <div className="space-y-1.5 group">
                <label className="block text-[10px] font-black text-zinc-300 uppercase tracking-[0.4em] ml-2 group-focus-within:text-purple-400 transition-colors">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none"><i className="ri-mail-fill text-zinc-500 text-sm"></i></div>
                  <input
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="w-full pl-12 pr-4 py-3 bg-white/[0.04] border border-white/5 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/30 transition-all font-bold text-sm"
                    placeholder="user@vault.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5 group">
                <label className="block text-[10px] font-black text-zinc-300 uppercase tracking-[0.4em] ml-2 group-focus-within:text-purple-400 transition-colors">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none"><i className="ri-lock-2-fill text-zinc-500 text-sm"></i></div>
                  <input
                    type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full pl-12 pr-14 py-3 bg-white/[0.04] border border-white/5 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/30 transition-all font-bold text-sm"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-5 flex items-center text-zinc-500 hover:text-white transition-colors">
                    <i className={showPassword ? "ri-eye-off-line" : "ri-eye-line text-lg"} />
                  </button>
                </div>
                <div className="flex justify-end mt-2">
                  <Tooltip text="Recover your account" position="top">
                    <Link to="/forgot-password" size="sm" className="text-[11px] text-zinc-400 hover:text-purple-400 font-black uppercase tracking-widest transition-all hover:underline decoration-purple-500/50 underline-offset-4 pointer-events-auto">Forgot Password?</Link>
                  </Tooltip>
                </div>
              </div>

              <button type="submit" disabled={isLoggingIn} className="w-full h-12 group/btn mt-1 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl blur opacity-25 group-hover/btn:opacity-40 transition-opacity" />
                <div className={`relative h-full w-full ${isLoggingIn ? 'bg-zinc-800' : 'bg-gradient-to-r from-purple-600 to-blue-500'} rounded-xl flex items-center justify-center gap-2 text-white font-black uppercase tracking-[0.2em] text-[11px] shadow-xl active:scale-95 transition-all`}>
                  {isLoggingIn ? <>Verifying... <i className="ri-loader-4-line animate-spin"></i></> : <>Log In <i className="ri-arrow-right-line"></i></>}
                </div>
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-white/5 flex flex-col items-center lg:items-start">
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1 opacity-50">New to the family?</p>
              <Link to="/register" className="group inline-flex items-center gap-3 text-white hover:text-purple-400 font-black tracking-[0.1em] transition-all uppercase text-[11px]">
                <span className="relative">Create Account <div className="absolute -bottom-1 left-0 w-full h-[1px] bg-white/10 group-hover:bg-purple-500/50" /></span>
                <i className="ri-add-line text-lg bg-white/5 w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-purple-500 transition-all shadow-lg"></i>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;
