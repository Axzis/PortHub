
"use client";

import { useState, useTransition, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { useAuth } from "@/contexts/auth-context";

const profileSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters." })
    .max(20, { message: "Username must be no more than 20 characters." })
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: "Username can only contain letters, numbers, and underscores.",
    }),
});

function FinishProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [isPending, startTransition] = useTransition();

  const uid = searchParams.get('uid');
  const email = searchParams.get('email');

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { username: "" },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
    if (!uid || !email) {
       router.replace("/");
    }
  }, [user, authLoading, uid, email, router]);

  const checkUsernameUnique = async (username: string) => {
    const userDocRef = doc(db, "usernames", username.toLowerCase());
    const docSnap = await getDoc(userDocRef);
    return !docSnap.exists();
  };

  const onSubmit = (values: z.infer<typeof profileSchema>) => {
    startTransition(async () => {
      if (!uid || !email) {
        toast({ variant: "destructive", title: "Error", description: "Missing user information." });
        return;
      }

      try {
        const { username } = values;
        const isUnique = await checkUsernameUnique(username);
        if (!isUnique) {
          form.setError("username", { message: "This username is already taken." });
          return;
        }

        await setDoc(doc(db, "users", uid), {
          username: username.toLowerCase(),
          email: email,
          createdAt: serverTimestamp(),
        });
        await setDoc(doc(db, "usernames", username.toLowerCase()), {
          uid: uid,
        });
        await setDoc(doc(db, "portfolios", uid), {
            fullName: "Your Name",
            title: "Your Title",
            bio: "A short bio about yourself.",
            profilePictureUrl: user?.photoURL || "",
            website: "",
            skills: [{name: "React"}, {name: "Next.js"}, {name: "Firebase"}],
            projects: [],
            workExperiences: [],
            organizationExperiences: [],
            educations: [],
            certifications: [],
            courses: [],
            testimonials: [],
            socialMedia: [],
            theme: 'default',
        });

        toast({ title: "Profile complete!", description: "Welcome to PortfolioHub." });
        router.push("/dashboard");
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to save profile. Please try again.",
        });
      }
    });
  };

  if (authLoading || !user) {
    return <Loader2 className="h-8 w-8 animate-spin mx-auto mt-24" />
  }

  return (
    <div className="flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">One Last Step</CardTitle>
          <CardDescription>
            Choose a unique username to finish creating your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Complete Profile
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function FinishProfilePage() {
    return (
        <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin mx-auto mt-24" />}>
            <FinishProfileForm />
        </Suspense>
    )
}
