import React, { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import API_BASE_URL from "../config/api";
import logo from "./../../public/logo3.jpg";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }
    
    setIsSubmitting(true);
    setError("");

    try {
      await axios.put(`${API_BASE_URL}/api/auth/resetpassword/${token}`, { password });
      navigate("/login", { state: { message: "Password updated successfully! Please login with your new password." } });
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired token. Please request a new link.");
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
            animate={{ scale: [1.2, 1, 1.2], rotate: [0, -45, 0], x: [0, -30, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full"
          />
        </div>

        <div className="relative z-10 flex items-center justify-center w-full px-12">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="backdrop-blur-3xl bg-white/[0.03] p-12 rounded-[3.5rem] border border-white/10 shadow-2xl text-center max-w-sm relative group"
          >
            <div className="mb-8 relative inline-block">
              <img src={logo} alt="Logo" className="w-28 h-28 rounded-3xl shadow-2xl border border-white/10 relative z-10" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-tight mb-3">
              Reset <br /> <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Key</span>
            </h1>
            <p className="text-zinc-400 text-[10px] font-bold tracking-[0.2em] uppercase opacity-70">Update your access point</p>
          </motion.div>
        </div>
      </div>

      {/* 2. Right Section: Form */}
      <div className="flex-1 flex flex-col relative z-20 h-full overflow-y-auto">
        <div className="p-4 lg:p-6 flex items-center justify-between invisible">
          {/* Kept for spacing consistency */}
          <div className="w-8 h-8 rounded-full bg-white/5"></div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 lg:px-14 pb-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
            <div className="mb-6 text-left">
              <h2 className="text-4xl font-black text-white mb-1 tracking-tighter uppercase italic">Secure Reset</h2>
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] opacity-50">Set a new, secure password for your vault</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5 group">
                <label className="block text-[10px] font-black text-zinc-300 uppercase tracking-[0.4em] ml-2 group-focus-within:text-blue-400 transition-colors">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none"><i className="ri-lock-password-fill text-zinc-500 text-sm"></i></div>
                  <input
                    type={showPassword ? "text" : "password"} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full pl-12 pr-14 py-3 bg-white/[0.04] border border-white/5 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/30 transition-all font-bold text-sm"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-5 flex items-center text-zinc-500 hover:text-white transition-colors">
                    <i className={showPassword ? "ri-eye-off-line" : "ri-eye-line text-lg"} />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 group">
                <label className="block text-[10px] font-black text-zinc-300 uppercase tracking-[0.4em] ml-2 group-focus-within:text-blue-400 transition-colors">Confirm New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none"><i className="ri-checkbox-circle-line text-zinc-500 text-sm"></i></div>
                  <input
                    type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full pl-12 pr-4 py-3 bg-white/[0.04] border border-white/5 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/30 transition-all font-bold text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && <p className="text-[11px] font-bold text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</p>}

              <button type="submit" disabled={isSubmitting} className="w-full h-12 group/btn mt-2 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-25 group-hover/btn:opacity-40 transition-opacity" />
                <div className={`relative h-full w-full ${isSubmitting ? 'bg-zinc-800' : 'bg-gradient-to-r from-blue-600 to-purple-600'} rounded-xl flex items-center justify-center gap-2 text-white font-black uppercase tracking-[0.2em] text-[11px] shadow-xl active:scale-95 transition-all`}>
                  {isSubmitting ? <>Updating... <i className="ri-loader-4-line animate-spin"></i></> : <>Save New Password <i className="ri-shield-check-fill"></i></>}
                </div>
              </button>
            </form>

            <div className="mt-8 pt-5 border-t border-white/5 flex flex-col items-center lg:items-start opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
               <p className="text-[9px] text-zinc-600 italic">Security Recommendation: Use at least 6 characters including numbers and special symbols.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
