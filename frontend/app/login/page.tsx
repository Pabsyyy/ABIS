'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { gsap } from 'gsap';
import { Eye, EyeOff, Landmark, Loader2, LogIn } from 'lucide-react';
import { api, type ApiUser } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const loginSchema = z.object({
  username: z.string().trim().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(1, 'Password is required'),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
      );
    }
  }, []);

  const onSubmit = async (values: LoginValues) => {
    setServerError(null);
    const res = await api<{ user: ApiUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(values),
    });

    if (!res.success) {
      setServerError(res.message ?? 'Login failed. Please try again.');
      return;
    }
    router.replace('/dashboard');
    router.refresh();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-primary px-4">
      <div ref={cardRef} className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-white text-primary">
            <Landmark size={28} strokeWidth={1.75} />
          </div>
          <h1 className="text-xl font-semibold text-white">Barangay Ambucao</h1>
          <p className="text-sm text-white/70">Santiago, Ilocos Sur</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>ABIS — Sign In</CardTitle>
            <CardDescription>Integrated Barangay Information System. Authorized personnel only.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
              <div className="flex flex-col gap-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" autoComplete="username" placeholder="e.g. secretary" {...register('username')} />
                {errors.username && <p className="text-xs text-red-600">{errors.username.message}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="pr-10"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center rounded-md text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
              </div>

              {serverError && (
                <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {serverError}
                </p>
              )}

              <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />}
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-white/60">
          Residents are served at the Barangay Hall. No public registration.
        </p>
      </div>
    </main>
  );
}
