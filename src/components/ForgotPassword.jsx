import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import API_BASE_URL from "../config/api";
import logo from "./../../public/logo3.jpg";

const ForgotPassword = () => {
  const [identifier, setIdentifier] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/auth/forgotpassword`, { identifier });
      setMessage("Reset link sent! Please check your email inbox.");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="lg:h-screen lg:overflow-hidden min-h-screen bg-slate-900 flex lg:flex-row flex-col relative font-sans">
      
      {/* 1. Left Section: Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative h-full border-r border-white/5 overflow-hidden bg-slate-950/20">
        <div className="absolute inset-0 z-0">
          <motion.div 
            animate={{ scale: [1, 1.2, 1], rotate: [0, 45, 0], x: [0, 30, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-[10%] -left-[10%] w-[600px] h-[600px] bg-purple-500/10 blur-[120px] rounded-full"
          />
        </div>

        <div className="relative z-10 flex items-center justify-center w-full px-12">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="backdrop-blur-3xl bg-white/[0.03] p-12 rounded-[3.5rem] border border-white/10 shadow-2xl text-center max-w-sm"
          >
            <div className="mb-8 relative inline-block">
              <img src={logo} alt="Logo" className="w-28 h-28 rounded-3xl shadow-2xl border border-white/10 relative z-10" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-tight mb-3">
              Recover <br /> <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Vault</span>
            </h1>
            <p className="text-zinc-400 text-[10px] font-bold tracking-[0.2em] uppercase opacity-70">Security & Restoration</p>
          </motion.div>
        </div>
      </div>

      {/* 2. Right Section: Form */}
      <div className="flex-1 flex flex-col relative z-20 h-full">
        <div className="p-4 lg:p-6 flex items-center justify-between">
          <Link to="/login" className="flex items-center gap-2 text-zinc-500 hover:text-white transition-all group">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-purple-500 transition-all font-bold"><i className="ri-arrow-left-line"></i></div>
            <span className="font-bold text-[8px] tracking-[0.2em] uppercase opacity-60">Back to Login</span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 lg:px-14 pb-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
            <div className="mb-6 text-left">
              <h2 className="text-4xl font-black text-white mb-1 tracking-tighter uppercase italic">Forgot Password</h2>
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] opacity-50">Enter your email / username to receive a reset link</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5 group">
                <label className="block text-[10px] font-black text-zinc-300 uppercase tracking-[0.4em] ml-2 group-focus-within:text-purple-400 transition-colors">Username or Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none"><i className="ri-user-search-line text-zinc-500 text-sm"></i></div>
                  <input
                    type="text" required value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/[0.04] border border-white/5 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/30 transition-all font-bold text-sm"
                    placeholder="sound_wizard or email@vault.com"
                  />
                </div>
              </div>

              {message && <p className="text-[11px] font-bold text-green-400 bg-green-500/10 p-3 rounded-lg border border-green-500/20">{message}</p>}
              {error && <p className="text-[11px] font-bold text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</p>}

              <button type="submit" disabled={isSubmitting} className="w-full h-12 group/btn mt-2 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl blur opacity-25 group-hover/btn:opacity-40 transition-opacity" />
                <div className={`relative h-full w-full ${isSubmitting ? 'bg-zinc-800' : 'bg-gradient-to-r from-purple-600 to-blue-500'} rounded-xl flex items-center justify-center gap-2 text-white font-black uppercase tracking-[0.2em] text-[11px] shadow-xl active:scale-95 transition-all`}>
                  {isSubmitting ? <>Sending... <i className="ri-loader-4-line animate-spin"></i></> : <>Send Reset Link <i className="ri-send-plane-2-fill"></i></>}
                </div>
              </button>
            </form>

            <div className="mt-8 pt-5 border-t border-white/5 flex flex-col items-center lg:items-start">
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-2 opacity-50">Remember your password?</p>
              <Link to="/login" className="group inline-flex items-center gap-3 text-white hover:text-purple-400 font-black tracking-[0.1em] transition-all uppercase text-[11px]">
                <span className="relative">Sign In Now <div className="absolute -bottom-1 left-0 w-full h-[1px] bg-white/10 group-hover:bg-purple-500/50" /></span>
                <i className="ri-login-box-line text-lg bg-white/5 w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-purple-500 transition-all shadow-lg"></i>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
