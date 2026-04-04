import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import API_BASE_URL from "../config/api";
import logo from "./../../public/logo3.jpg";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const { register, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      setIsChecking(false);
      return;
    }

    const check = async () => {
      setIsChecking(true);
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/auth/check-username/${username}`);
        setUsernameAvailable(data.available);
      } catch (error) {
        console.error("Username check failed", error);
      } finally {
        setIsChecking(false);
      }
    };

    const timeoutId = setTimeout(check, 500);
    return () => clearTimeout(timeoutId);
  }, [username]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (usernameAvailable === false) return;
    setIsRegistering(true);
    try {
      const success = await register(username, email, password);
      if (success) {
        navigate("/");
      }
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="lg:h-screen lg:overflow-hidden min-h-screen bg-slate-900 flex lg:flex-row flex-col relative font-sans">
      
      {/* 1. Left Section: Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative h-full border-r border-white/5 overflow-hidden bg-slate-950/20">
        <div className="absolute inset-0 z-0">
          <motion.div 
            animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0], x: [0, -50, 0] }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-blue-500/20 blur-[120px] rounded-full"
          />
          <motion.div 
            animate={{ scale: [1.3, 1, 1.3], x: [0, 70, 0], y: [0, -50, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/15 blur-[100px] rounded-full"
          />
        </div>

        <div className="relative z-10 flex items-center justify-center w-full px-12">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="backdrop-blur-3xl bg-white/[0.03] p-12 rounded-[3.5rem] border border-white/10 shadow-2xl text-center max-w-sm relative group"
          >
            <div className="mb-6 relative inline-block">
              <div className="absolute -inset-8 bg-blue-500/20 blur-3xl rounded-full" />
              <img src={logo} alt="Logo" className="w-28 h-28 rounded-3xl shadow-2xl border border-white/10 relative z-10 transform rotate-6 group-hover:rotate-0 transition-transform duration-700" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-tight mb-3">Join The <br/> <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Journey</span></h1>
            <p className="text-zinc-400 text-[10px] font-bold tracking-[0.2em] uppercase opacity-70">Start your musical legacy</p>
          </motion.div>
        </div>
      </div>

      {/* 2. Right Section: Form */}
      <div className="flex-1 flex flex-col relative z-20 h-full overflow-y-auto lg:overflow-visible">
        <div className="p-3 lg:p-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-zinc-500 hover:text-white transition-all group">
            <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-500 transition-all font-bold"><i className="ri-arrow-left-line text-sm"></i></div>
            <span className="font-bold text-[8px] tracking-[0.2em] uppercase opacity-60">Return Home</span>
          </Link>
          <img src={logo} alt="Logo" className="w-8 h-8 rounded-lg lg:hidden" />
        </div>

        <div className="flex-1 flex items-center justify-center px-6 lg:px-14 pb-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
            <div className="mb-2 text-left">
              <h2 className="text-4xl font-black text-white mb-1 tracking-tighter uppercase italic">Create Account</h2>
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] opacity-50">Join the ultimate family</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-2">
              <div className="space-y-1.5 group">
                <label className="block text-[10px] font-black text-zinc-300 uppercase tracking-[0.4em] ml-2 group-focus-within:text-blue-400 transition-colors">Pick a Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <i className={`ri-user-heart-fill text-sm transition-colors ${usernameAvailable === true ? 'text-green-500' : usernameAvailable === false ? 'text-red-500' : 'text-zinc-500'}`}></i>
                  </div>
                  <input
                    type="text" required minLength={3} value={username} onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    className={`w-full pl-12 pr-12 py-2.5 bg-white/[0.04] border rounded-xl text-white placeholder-zinc-500 transition-all font-bold text-sm ${usernameAvailable === true ? 'border-green-500/50':'border-white/5'}`}
                    placeholder="sound_wizard"
                  />
                  {usernameAvailable !== null && (
                    <div className="absolute inset-y-0 right-0 pr-5 flex items-center">
                      {isChecking ? <i className="ri-loader-4-line animate-spin text-zinc-500"></i> : usernameAvailable ? <i className="ri-checkbox-circle-fill text-green-500"></i> : <i className="ri-error-warning-fill text-red-500"></i>}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 group">
                <label className="block text-[10px] font-black text-zinc-300 uppercase tracking-[0.4em] ml-2 group-focus-within:text-blue-400 transition-colors">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none"><i className="ri-mail-fill text-zinc-500 text-sm"></i></div>
                  <input
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="w-full pl-12 pr-4 py-3 bg-white/[0.04] border border-white/5 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/30 transition-all font-bold text-sm"
                    placeholder="user@vault.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5 group">
                <label className="block text-[10px] font-black text-zinc-300 uppercase tracking-[0.4em] ml-2 group-focus-within:text-blue-400 transition-colors">Secure Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none"><i className="ri-lock-password-fill text-zinc-500 text-sm"></i></div>
                  <input
                    type={showPassword ? "text" : "password"} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    className="w-full pl-12 pr-14 py-3 bg-white/[0.04] border border-white/5 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/30 transition-all font-bold text-sm"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-5 flex items-center text-zinc-600 hover:text-white transition-colors">
                    <i className={showPassword ? "ri-eye-off-line" : "ri-eye-line text-lg"} />
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isRegistering || usernameAvailable === false} className="w-full h-12 group/btn mt-1 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-20 group-hover/btn:opacity-40 transition-opacity" />
                <div className={`relative h-full w-full ${(isRegistering || usernameAvailable === false) ? 'bg-zinc-800' : 'bg-gradient-to-r from-blue-600 to-purple-600'} rounded-xl flex items-center justify-center gap-2 text-white font-black uppercase tracking-[0.2em] text-[11px] shadow-xl active:scale-95 transition-all`}>
                  {isRegistering ? <>Stamping... <i className="ri-loader-4-line animate-spin"></i></> : <>Sign Up Now <i className="ri-sparkling-2-line"></i></>}
                </div>
              </button>
            </form>

            <div className="mt-3 pt-2 border-t border-white/5 flex flex-col items-center lg:items-start">
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1 opacity-50">Already part of us?</p>
              <Link to="/login" className="group inline-flex items-center gap-3 text-white hover:text-blue-400 font-black tracking-[0.1em] transition-all uppercase text-[11px]">
                <span className="relative">Login Instead <div className="absolute -bottom-1 left-0 w-full h-[1px] bg-white/10 group-hover:bg-blue-500/50" /></span>
                <i className="ri-login-box-fill text-lg bg-white/5 w-7 h-7 rounded-full flex items-center justify-center group-hover:bg-blue-500 transition-all shadow-lg"></i>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Register;
