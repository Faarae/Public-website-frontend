'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { Mail, Lock, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import api from '@/services/api';

const loginSchema = zod.object({
  email: zod.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  password: zod.string().min(1, 'Password wajib diisi'),
});

type LoginForm = zod.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // If already logged in, redirect straight away
    if (localStorage.getItem('token')) {
      router.push('/dashboard');
    }
  }, [router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    setLoading(true);

    try {
      const response = await api.post('/auth/login', data);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      router.push('/dashboard');
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.status === 401) {
        setError('Email atau password salah.');
      } else {
        setError('Tidak dapat terhubung ke server autentikasi. Pastikan backend berjalan.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-955 overflow-hidden px-4 transition-colors duration-300">
      {/* Subtle Villa Silhouette Background (fixed non-standard opacity class to standard 8% watermark) */}
      <div 
        className="absolute inset-0 z-0 bg-[url('/villa.jpg')] bg-cover bg-center opacity-[0.08] pointer-events-none filter blur-sm dark:grayscale contrast-125 transition-opacity"
      ></div>

      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-cyan-600/10 dark:bg-cyan-600/20 blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-indigo-600/5 dark:bg-indigo-600/10 blur-3xl"></div>

      <div className="w-full max-w-md z-10">
        {/* Logo and Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-cyan-500/25 mb-4 animate-pulse">
            <span className="text-white text-3xl font-extrabold tracking-wider">Z</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Zain Al Mansion</h2>
          <p className="text-sm text-slate-650 dark:text-slate-400 mt-1">Konsol Manajemen Keuangan Konstruksi</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-xl transition-colors">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Masuk</h3>

          {error && (
            <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 p-4 rounded-xl text-sm mb-6">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Alamat Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-450 dark:text-slate-500">
                  <Mail className="h-5 w-5" />
                </span>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="nama@example.com"
                  className={`w-full bg-slate-50 dark:bg-slate-955/60 border ${
                    errors.email ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                  } focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-slate-900 dark:text-white rounded-xl py-3 pl-10 pr-4 outline-none transition-all duration-200`}
                />
              </div>
              {errors.email && <p className="text-xs text-rose-500">{errors.email.message}</p>}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Kata Sandi (Password)</label>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-450 dark:text-slate-500">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="••••••••"
                  className={`w-full bg-slate-50 dark:bg-slate-955/60 border ${
                    errors.password ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                  } focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-slate-900 dark:text-white rounded-xl py-3 pl-10 pr-10 outline-none transition-all duration-200`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-450 hover:text-slate-655 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-rose-500">{errors.password.message}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-xl py-3.5 hover:shadow-lg hover:shadow-cyan-500/20 disabled:opacity-50 transition-all duration-200 mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  Masuk ke Dashboard
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Info footer */}
        <div className="mt-8 text-center text-xs text-slate-500 dark:text-slate-550">
          <p>&copy; {new Date().getFullYear()} Zain Al Mansion. Hak Cipta Dilindungi Undang-Undang.</p>
        </div>
        </div>
      </div>
  );
}
