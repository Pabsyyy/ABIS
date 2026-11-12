'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { gsap } from 'gsap';
import { Award, BarChart3, Eye, EyeOff, IdCard, Loader2, Lock, LogIn, Settings2 } from 'lucide-react';
import { api, type ApiUser } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';

const loginSchema = z.object({
  username: z.string().trim().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
});

type LoginValues = z.infer<typeof loginSchema>;

const features = [
  { icon: IdCard, title: 'Resident Profiling', text: 'Manage and Maintain Resident Records' },
  { icon: Award, title: 'Certificate Issuance', text: 'Generate and print Barangay Certificates' },
  { icon: Settings2, title: 'Service Management', text: 'Track and Monitor Service Requests' },
  { icon: BarChart3, title: 'Reports and Analytics', text: 'Generate Reports for Better Decision Making' },
];

export default function LoginPage() {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { remember: false } });

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
      );
    }
  }, []);

  const onSubmit = async (values: LoginValues) => {
    setServerError(null);
    const res = await api<{ user: ApiUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: values.username, password: values.password, remember: Boolean(values.remember) }),
    });

    if (!res.success) {
      setServerError(res.message ?? 'Login failed. Please try again.');
      return;
    }

    const nextParam = new URLSearchParams(window.location.search).get('next');
    const safeNext = nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : null;
    const destination = res.data?.user.role === 'resident' ? '/home' : safeNext ?? '/dashboard';
    router.replace(destination);
    router.refresh();
  };

  return (
    <main className="grid min-h-screen font-poppins lg:grid-cols-[60%_40%]">
      <section
        className="relative hidden flex-col lg:flex"
        style={{
          backgroundColor: '#0B2A4A',
          backgroundImage:
            "linear-gradient(180deg, rgba(9,36,64,0.55) 0%, rgba(9,36,64,0.62) 55%, rgba(8,30,54,0.80) 100%), url('/images/login-bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="flex flex-1 flex-col items-center justify-center px-8 py-10 text-center text-white xl:px-12">
          <Image
            src="/images/santiago-seal.png"
            alt="Municipality of Santiago seal"
            width={112}
            height={112}
            priority
            className="h-24 w-24 rounded-full object-cover ring-2 ring-white/25 drop-shadow-[0_6px_14px_rgba(0,0,0,0.35)] xl:h-28 xl:w-28"
          />
          <h1 className="mt-5 text-[28px] font-bold leading-tight tracking-tight xl:text-[32px]">Barangay Ambucao</h1>
          <p className="mt-1 text-base font-medium text-white/90 xl:text-lg">Integrated Barangay Information System</p>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-white/80">
            A centralized system for resident profiling and service management to improve transparency,
            efficiency, and public service.
          </p>

          <div className="mt-10 grid w-full max-w-3xl grid-cols-4 gap-3 xl:gap-4">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                  <Icon size={24} strokeWidth={1.6} className="text-white" />
                </div>
                <p className="text-[11px] font-semibold leading-tight text-white">{title}</p>
                <p className="text-[9px] leading-snug text-white/70">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="pb-6 text-center text-[11px] text-white/60">
          ©{new Date().getFullYear()} Barangay Ambucao, Santiago, Ilocos Sur
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-[#EEF3FA] px-4 py-8 sm:px-6 sm:py-10 lg:px-4 xl:px-6">
        <div className="w-full max-w-[420px]">
          <div className="mb-6 flex flex-col items-center text-center lg:hidden">
            <Image
              src="/images/santiago-seal.png"
              alt="Municipality of Santiago seal"
              width={64}
              height={64}
              priority
              className="h-16 w-16 rounded-full object-cover ring-2 ring-white/60"
            />
            <p className="mt-2 text-lg font-semibold text-[#0C3B6E]">Barangay Ambucao</p>
            <p className="text-xs text-[#7A8CA1]">Integrated Barangay Information System</p>
          </div>

          <div
            ref={cardRef}
            className="rounded-lg border border-[#DCE7F3] bg-white px-6 py-7 shadow-[0_18px_40px_rgba(11,42,74,0.12)] sm:px-8 sm:py-8"
          >
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#2F80ED] text-white shadow-[0_6px_16px_rgba(47,128,237,0.35)]">
                <Lock size={24} strokeWidth={2} />
              </div>
              <h2 className="text-2xl font-semibold text-[#0C3B6E]">Welcome Back!</h2>
              <p className="mt-1 text-xs text-[#7A8CA1]">Please login to your account and continue</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="username" className="text-[11px] font-semibold text-[#274B6D]">
                  Username:
                </Label>
                <Input
                  id="username"
                  autoComplete="username"
                  className="h-11 rounded-md border-[#CFDAE8] text-sm focus-visible:ring-[#2F80ED]"
                  {...register('username')}
                />
                {errors.username && <p className="text-xs text-red-600">{errors.username.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password" className="text-[11px] font-semibold text-[#274B6D]">
                  Password:
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="h-11 rounded-md border-[#CFDAE8] pr-10 text-sm focus-visible:ring-[#2F80ED]"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    className="absolute right-0 top-0 flex h-11 w-10 items-center justify-center rounded-md text-[#7A8CA1] transition-colors hover:text-[#0C3B6E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F80ED]"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
              </div>

              <div className="flex items-center justify-between">
                <label htmlFor="remember" className="flex cursor-pointer items-center gap-2 text-xs text-[#4A6480]">
                  <input
                    id="remember"
                    type="checkbox"
                    className="h-4 w-4 rounded border-[#CFDAE8] accent-[#2F80ED]"
                    {...register('remember')}
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-xs font-medium text-[#2F80ED] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F80ED]"
                >
                  Forgot Password?
                </button>
              </div>

              {serverError && (
                <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {serverError}
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="h-11 w-full rounded-md bg-[#2F80ED] font-medium text-white hover:bg-[#1469D4]"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />}
                {isSubmitting ? 'Logging in…' : 'Login'}
              </Button>
            </form>
          </div>

          <p className="mt-5 text-center text-[11px] text-[#7A8CA1]">For Authorized Personnel Only</p>
        </div>
      </section>

      <Modal
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        title="Forgot password"
        description="Password reset is handled by the barangay office."
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            Please contact the Barangay Secretary at the Barangay Hall to reset your password. For security, passwords
            are never sent through this system.
          </p>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setForgotOpen(false)}>
              Got it
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
