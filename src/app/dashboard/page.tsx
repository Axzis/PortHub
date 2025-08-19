"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowRight, Edit, Eye } from "lucide-react";

export default function DashboardPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    router.replace('/login');
    return null;
  }

  if(!userData) {
    // This case is for google sign in users who haven't picked a username
    router.replace(`/finish-profile?uid=${user.uid}&email=${user.email}`);
    return (
        <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl py-12">
      <div className="space-y-4 mb-8">
        <h1 className="text-3xl font-bold font-headline">
          Welcome back, {userData.username}!
        </h1>
        <p className="text-muted-foreground">
          Manage your portfolio and share your work with the world.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Your Portfolio</CardTitle>
          <CardDescription>Your public portfolio is live. View, edit, or share it using the link below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-2 rounded-md border p-3 bg-muted">
            <Link 
              href={`/portfolio/${userData.username}`} 
              className="text-sm text-primary hover:underline flex-1 truncate"
              target="_blank"
              rel="noopener noreferrer"
            >
              {`portfoliohub.app/portfolio/${userData.username}`}
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
             <Button asChild className="w-full sm:w-auto">
                <Link href="/editor">
                    <Edit className="mr-2 h-4 w-4" /> Edit Portfolio
                </Link>
             </Button>
             <Button asChild variant="secondary" className="w-full sm:w-auto">
                <Link href={`/portfolio/${userData.username}`} target="_blank">
                    <Eye className="mr-2 h-4 w-4" /> View Public Page
                </Link>
             </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
