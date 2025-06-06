"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useToast } from "@/hooks/use-toast";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Database } from "@/lib/supabase/database.types";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type FormValues = z.infer<typeof formSchema>;

export default function SignInPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClientComponentClient<Database>();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: FormValues) {
    setIsLoading(true);

    try {
      console.log('Starting signin process for:', data.email);

      // First check if there's an existing session and sign out
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('Found existing session, signing out...');
        await supabase.auth.signOut();
      }

      console.log('Attempting to sign in...');
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        console.error('Auth error:', error);
        throw error;
      }

      if (!authData.user) {
        console.error('No user data found after successful auth');
        throw new Error("No user data found");
      }

      console.log('Auth successful, checking user profile...');
      // Get user role and approval status
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, role, is_approved, email")
        .eq("id", authData.user.id)
        .single();

      if (userError) {
        console.error('User data error:', userError);
        // If user profile doesn't exist, sign out and throw error
        await supabase.auth.signOut();
        throw new Error("User profile not found. Please contact support.");
      }

      if (!userData) {
        console.error('No user profile found in database');
        await supabase.auth.signOut();
        throw new Error("User profile not found. Please contact support.");
      }

      console.log('User profile found:', userData);

      if (!userData.is_approved) {
        console.log('User not approved, signing out...');
        await supabase.auth.signOut();
        toast({
          title: "Account pending approval",
          description: "Your account is waiting for admin approval. You'll be notified once approved.",
        });
        router.push("/pending-approval");
        return;
      }

      toast({
        title: "Sign in successful",
        description: "Welcome back!",
      });

      // Redirect based on role
      let dashboardPath = '/';
      switch (userData.role) {
        case 'admin':
          dashboardPath = '/admin/dashboard';
          break;
        case 'alumni':
          dashboardPath = '/alumni/dashboard';
          break;
        case 'student':
          dashboardPath = '/student/dashboard';
          break;
        default:
          dashboardPath = '/';
      }

      console.log('Redirecting to:', dashboardPath);
      router.push(dashboardPath);
      
      // Force a router refresh to ensure the middleware picks up the new session
      router.refresh();
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast({
        title: "Sign in failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-secondary/10">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/auth/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
} 