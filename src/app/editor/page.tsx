"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/auth-context";
import { db, storage } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, PlusCircle, Trash2, UploadCloud } from "lucide-react";
import Image from "next/image";

const projectSchema = z.object({
  title: z.string().min(1, "Project title is required"),
  description: z.string().min(1, "Project description is required"),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  link: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

const portfolioSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  title: z.string().min(1, "Title is required"),
  bio: z.string().min(1, "Bio is required").max(300, "Bio cannot exceed 300 characters"),
  profilePictureUrl: z.string().url().optional().or(z.literal("")),
  skills: z.array(z.string().min(1)).min(1, "At least one skill is required"),
  projects: z.array(projectSchema),
});

type PortfolioFormValues = z.infer<typeof portfolioSchema>;

export default function EditorPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loadingData, setLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('content'); // content, projects

  const form = useForm<PortfolioFormValues>({
    resolver: zodResolver(portfolioSchema),
    defaultValues: {
      fullName: "",
      title: "",
      bio: "",
      profilePictureUrl: "",
      skills: [],
      projects: [],
    },
  });

  const { watch } = form;
  const watchedValues = watch();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
    if(authLoading) return;

    if (user) {
      const fetchPortfolio = async () => {
        setLoadingData(true);
        const portfolioDocRef = doc(db, "portfolios", user.uid);
        const docSnap = await getDoc(portfolioDocRef);
        if (docSnap.exists()) {
          form.reset(docSnap.data() as PortfolioFormValues);
        }
        setLoadingData(false);
      };
      fetchPortfolio();
    }
  }, [user, authLoading, router, form]);

  const handleImageUpload = async (file: File, fieldName: string, projectIndex?: number) => {
    if (!user) return;
    const toastId = toast({ title: "Uploading image...", description: "Please wait." }).id;
    
    const storageRef = ref(storage, `images/${user.uid}/${Date.now()}_${file.name}`);
    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      if (fieldName === 'profilePictureUrl') {
        form.setValue('profilePictureUrl', downloadURL);
      } else if (fieldName === 'projectImageUrl' && projectIndex !== undefined) {
        form.setValue(`projects.${projectIndex}.imageUrl`, downloadURL);
      }
      
      toast.update(toastId, { title: "Success!", description: "Image uploaded." });
    } catch (error) {
      toast.update(toastId, { variant: "destructive", title: "Upload failed", description: "Could not upload image." });
    }
  };


  const onSubmit = async (data: PortfolioFormValues) => {
    if (!user) {
      toast({ variant: "destructive", title: "Not authenticated" });
      return;
    }
    setIsSaving(true);
    try {
      const portfolioDocRef = doc(db, "portfolios", user.uid);
      await setDoc(portfolioDocRef, data, { merge: true });
      toast({
        title: "Portfolio Saved!",
        description: "Your changes have been successfully saved.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save portfolio.",
      });
    } finally {
      setIsSaving(false);
    }
  };

   if (authLoading || loadingData) {
    return <div className="flex h-full w-full items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="grid md:grid-cols-2 gap-4 min-h-[calc(100vh-4rem)]">
        {/* Editor Side */}
        <div className="bg-card text-card-foreground p-4 sm:p-6 md:p-8 h-full overflow-y-auto">
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="flex justify-between items-center">
                    <h1 className="font-headline text-3xl font-bold">Portfolio Editor</h1>
                     <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
                
                <Card>
                    <CardHeader><CardTitle>Profile Information</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="profilePictureUrl"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Profile Picture</FormLabel>
                                <div className="flex items-center gap-4">
                                {field.value && <Image src={field.value} alt="Profile preview" width={64} height={64} className="rounded-full" />}
                                <FormControl>
                                    <Input type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'profilePictureUrl')} className="hidden" id="profile-pic-upload"/>
                                </FormControl>
                                <Button asChild variant="outline">
                                    <label htmlFor="profile-pic-upload" className="cursor-pointer">
                                        <UploadCloud className="mr-2 h-4 w-4"/> Upload
                                    </label>
                                </Button>
                                </div>
                                 <Input {...field} placeholder="Or paste an image URL" className="mt-2" />
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField control={form.control} name="fullName" render={({ field }) => (
                            <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
                         )}/>
                         <FormField control={form.control} name="title" render={({ field }) => (
                            <FormItem><FormLabel>Title / Headline</FormLabel><FormControl><Input placeholder="Full-Stack Developer" {...field} /></FormControl><FormMessage /></FormItem>
                         )}/>
                         <FormField control={form.control} name="bio" render={({ field }) => (
                            <FormItem><FormLabel>Biography</FormLabel><FormControl><Textarea placeholder="Tell your story..." {...field} /></FormControl><FormDescription>Max 300 characters.</FormDescription><FormMessage /></FormItem>
                         )}/>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Skills</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <FormField control={form.control} name="skills" render={({ field }) => (
                            <FormItem>
                                 <FormLabel>Enter your skills separated by commas</FormLabel>
                                 <FormControl>
                                    <Input 
                                        placeholder="JavaScript, Python, Figma" 
                                        value={field.value.join(', ')} 
                                        onChange={(e) => field.onChange(e.target.value.split(',').map(skill => skill.trim()))}
                                    />
                                 </FormControl>
                                 <FormMessage />
                            </FormItem>
                        )}/>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Projects</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {form.getValues('projects').map((_, index) => (
                            <div key={index} className="space-y-4 p-4 border rounded-md relative">
                                <h3 className="font-semibold">Project {index+1}</h3>
                                <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => form.setValue('projects', form.getValues('projects').filter((_, i) => i !== index))}>
                                    <Trash2 className="h-4 w-4"/>
                                </Button>
                                <FormField control={form.control} name={`projects.${index}.title`} render={({field}) => (
                                    <FormItem><FormLabel>Project Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                 <FormField control={form.control} name={`projects.${index}.description`} render={({field}) => (
                                    <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name={`projects.${index}.imageUrl`} render={({field}) => (
                                    <FormItem><FormLabel>Image URL</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name={`projects.${index}.link`} render={({field}) => (
                                    <FormItem><FormLabel>Project Link</FormLabel><FormControl><Input placeholder="https://github.com/..." {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                            </div>
                        ))}
                         <Button type="button" variant="outline" onClick={() => form.setValue('projects', [...form.getValues('projects'), {title: '', description: '', imageUrl: '', link: ''}])}>
                           <PlusCircle className="mr-2 h-4 w-4"/> Add Project
                        </Button>
                    </CardContent>
                </Card>

                </form>
            </Form>
        </div>

        {/* Preview Side */}
        <div className="bg-background text-foreground p-4 sm:p-6 md:p-8 h-full overflow-y-auto hidden md:block">
            <div className="sticky top-8">
              <h2 className="font-headline text-2xl font-bold mb-4">Live Preview</h2>
              <div className="border rounded-lg aspect-[9/16] overflow-y-auto p-4">
                  <div className="text-center space-y-4">
                    {watchedValues.profilePictureUrl ? <Image src={watchedValues.profilePictureUrl} alt="profile" width={128} height={128} className="rounded-full mx-auto" /> : <div className="w-32 h-32 rounded-full bg-muted mx-auto"/>}
                    <h2 className="text-2xl font-bold font-headline">{watchedValues.fullName || "Your Name"}</h2>
                    <p className="text-muted-foreground">{watchedValues.title || "Your Title"}</p>
                    <p className="text-sm max-w-prose mx-auto">{watchedValues.bio || "Your bio will appear here."}</p>
                  </div>
                  <hr className="my-6" />
                  <div>
                    <h3 className="text-lg font-bold font-headline mb-4 text-center">Skills</h3>
                    <div className="flex flex-wrap gap-2 justify-center">
                        {watchedValues.skills?.map((skill, i) => skill && <span key={i} className="bg-primary/10 text-primary-foreground-subtle border border-primary/20 px-3 py-1 rounded-full text-sm">{skill}</span>)}
                    </div>
                  </div>
                   <hr className="my-6" />
                   <div>
                      <h3 className="text-lg font-bold font-headline mb-4 text-center">Projects</h3>
                      <div className="space-y-6">
                        {watchedValues.projects?.map((project, i) => (
                           <div key={i} className="border rounded-lg p-4">
                               {project.imageUrl && <Image src={project.imageUrl} alt={project.title} width={400} height={250} className="rounded-md w-full object-cover aspect-video mb-2" />}
                               <h4 className="font-bold">{project.title || `Project ${i+1}`}</h4>
                               <p className="text-sm text-muted-foreground">{project.description || "Project description..."}</p>
                               {project.link && <a href={project.link} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline mt-2 inline-block">View Project</a>}
                           </div>
                        ))}
                      </div>
                   </div>
              </div>
            </div>
        </div>
    </div>
  );
}

