
"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(1, { message: "Password is required." }),
});

const registerSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters." })
    .max(20, { message: "Username must be no more than 20 characters." })
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: "Username can only contain letters, numbers, and underscores.",
    }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
});

const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L38.804 8.841C34.532 4.901 29.508 2.5 24 2.5c-11.832 0-21.5 9.668-21.5 21.5S12.168 45.5 24 45.5s21.5-9.668 21.5-21.5c0-1.72-0.24-3.37-0.689-4.917z"/>
    <path fill="#FF3D00" d="M6.306 14.691c-2.221 4.34-3.435 9.389-3.435 14.654s1.214 10.314 3.435 14.654L15.11 34.4C13.593 31.424 12.8 27.868 12.8 24.045c0-3.823 0.793-7.379 2.31-10.354L6.306 14.691z"/>
    <path fill="#4CAF50" d="M24 45.5c5.508 0 10.532-2.401 14.804-6.345l-8.799-6.969c-2.31 1.56-5.093 2.5-8.005 2.5-4.823 0-8.98-2.658-10.9-6.355L4.866 34.8C9.14 41.353 16.034 45.5 24 45.5z"/>
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-0.793 2.56-2.235 4.82-4.243 6.55l8.799 6.969C41.812 36.971 44.5 31.258 44.5 24c0-1.72-0.24-3.37-0.689-4.917z"/>
  </svg>
);

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isGooglePending, setGooglePending] = useState(false);
  
  const formSchema = mode === "login" ? loginSchema : registerSchema;
  type FormValues = z.infer<typeof formSchema>;
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "", ...(mode === "register" && { username: "" }) },
  });

  const checkUsernameUnique = async (username: string) => {
    const userDocRef = doc(db, "usernames", username.toLowerCase());
    const docSnap = await getDoc(userDocRef);
    return !docSnap.exists();
  };

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      try {
        if (mode === "register") {
          const { email, password, username } = values as z.infer<typeof registerSchema>;
          const isUnique = await checkUsernameUnique(username);
          if (!isUnique) {
            form.setError("username", { message: "This username is already taken." });
            return;
          }
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          await setDoc(doc(db, "users", user.uid), {
            username: username.toLowerCase(),
            email: user.email,
            createdAt: serverTimestamp(),
          });
          await setDoc(doc(db, "usernames", username.toLowerCase()), {
            uid: user.uid,
          });
           await setDoc(doc(db, "portfolios", user.uid), {
              fullName: "Your Name",
              title: "Your Title",
              bio: "A short bio about yourself.",
              profilePictureUrl: "",
              skills: ["React", "Next.js", "Firebase"],
              projects: [],
              theme: 'default',
            });
          router.push("/dashboard");
        } else {
          const { email, password } = values;
          await signInWithEmailAndPassword(auth, email, password);
          router.push("/dashboard");
        }
      } catch (error: any) {
        console.error("Authentication Error Details:", error);
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: error.message || "An unknown error occurred.",
        });
      }
    });
  };
  
  const handleGoogleSignIn = async () => {
    setGooglePending(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
        client_id: '553955372034-trj15c1tir12pet69ci95r9okv2ke5vn.apps.googleusercontent.com'
    });
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
         // This is a new user, take them to finish their profile.
         router.push(`/finish-profile?uid=${user.uid}&email=${user.email}`);
      } else {
        // Existing user, just go to the dashboard.
        router.push('/dashboard');
      }

    } catch (error: any) {
       toast({
          variant: "destructive",
          title: "Google Sign-In Error",
          description: error.message,
        });
    } finally {
        setGooglePending(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">{mode === "login" ? "Welcome Back" : "Create an Account"}</CardTitle>
          <CardDescription>
            {mode === "login" ? "Sign in to access your dashboard." : "Enter your details to get started."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {mode === "register" && (
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="your_unique_name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
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
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isPending || isGooglePending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "login" ? "Login" : "Create Account"}
              </Button>
            </form>
          </Form>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isPending || isGooglePending}>
            {isGooglePending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
            Google
          </Button>
        </CardContent>
        <CardFooter className="text-sm">
          <p className="text-muted-foreground">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <Link href={mode === "login" ? "/register" : "/login"} className="font-medium text-primary hover:underline">
              {mode === "login" ? "Sign up" : "Login"}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
