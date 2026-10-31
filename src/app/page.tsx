'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';

export default function Home() {
  const { user, loading, isRole } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (loading) return;
    router.replace(!user ? '/login' : isRole('superuser') ? '/admin/stores' : '/dashboard');
  }, [loading, user, router, isRole]);
  return null;
}
