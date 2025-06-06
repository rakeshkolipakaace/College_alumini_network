"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUserRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth/signin');
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (userData) {
        switch (userData.role) {
          case 'admin':
            router.push('/profile/admin');
            break;
          case 'student':
            router.push('/profile/student');
            break;
          case 'alumni':
            router.push('/profile/alumni');
            break;
          default:
            router.push('/auth/signin');
        }
      }
    };

    getUserRole();
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
} 