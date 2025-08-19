
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/auth-context";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, PlusCircle, Trash2, UploadCloud, Linkedin, Github, Twitter, Link as LinkIcon } from "lucide-react";
import Image from "next/image";

const projectSchema = z.object({
  title: z.string().min(1, "Project title is required"),
  description: z.string().min(1, "Project description is required"),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  link: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

const workExperienceSchema = z.object({
    company: z.string().min(1, "Company name is required"),
    role: z.string().min(1, "Role is required"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().optional(),
    description: z.string().optional(),
});

const organizationExperienceSchema = z.object({
    organization: z.string().min(1, "Organization name is required"),
    role: z.string().min(1, "Role is required"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().optional(),
    description: z.string().optional(),
});

const educationSchema = z.object({
    institution: z.string().min(1, "Institution is required"),
    degree: z.string().min(1, "Degree is required"),
    fieldOfStudy: z.string().optional(),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().optional(),
});

const certificationSchema = z.object({
    name: z.string().min(1, "Certification name is required"),
    issuingOrganization: z.string().min(1, "Organization is required"),
    issueDate: z.string().optional(),
    credentialId: z.string().optional(),
});

const courseSchema = z.object({
    name: z.string().min(1, "Course name is required"),
    platform: z.string().optional(),
    completionDate: z.string().optional(),
});

const testimonialSchema = z.object({
    name: z.string().min(1, "Name is required"),
    feedback: z.string().min(1, "Feedback is required"),
    company: z.string().optional(),
});

const socialMediaSchema = z.object({
    platform: z.enum(["linkedin", "github", "twitter", "instagram", "facebook", "whatsapp"]),
    url: z.string().url("Must be a valid URL"),
});


const portfolioSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  title: z.string().min(1, "Title is required"),
  bio: z.string().min(1, "Bio is required").max(300, "Bio cannot exceed 300 characters"),
  profilePictureUrl: z.string().url().optional().or(z.literal("")),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  skills: z.array(z.string().min(1)).min(1, "At least one skill is required"),
  projects: z.array(projectSchema),
  workExperiences: z.array(workExperienceSchema),
  organizationExperiences: z.array(organizationExperienceSchema),
  educations: z.array(educationSchema),
  certifications: z.array(certificationSchema),
  courses: z.array(courseSchema),
  testimonials: z.array(testimonialSchema),
  socialMedia: z.array(socialMediaSchema),
});

type PortfolioFormValues = z.infer<typeof portfolioSchema>;

export default function EditorPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loadingData, setLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<PortfolioFormValues>({
    resolver: zodResolver(portfolioSchema),
    defaultValues: {
      fullName: "",
      title: "",
      bio: "",
      profilePictureUrl: "",
      website: "",
      skills: [],
      projects: [],
      workExperiences: [],
      organizationExperiences: [],
      educations: [],
      certifications: [],
      courses: [],
      testimonials: [],
      socialMedia: [],
    },
  });

  const { fields: projectFields, append: appendProject, remove: removeProject } = useFieldArray({ control: form.control, name: "projects" });
  const { fields: workFields, append: appendWork, remove: removeWork } = useFieldArray({ control: form.control, name: "workExperiences" });
  const { fields: orgFields, append: appendOrg, remove: removeOrg } = useFieldArray({ control: form.control, name: "organizationExperiences" });
  const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({ control: form.control, name: "educations" });
  const { fields: certFields, append: appendCert, remove: removeCert } = useFieldArray({ control: form.control, name: "certifications" });
  const { fields: courseFields, append: appendCourse, remove: removeCourse } = useFieldArray({ control: form.control, name: "courses" });
  const { fields: testimonialFields, append: appendTestimonial, remove: removeTestimonial } = useFieldArray({ control: form.control, name: "testimonials" });
  const { fields: socialFields, append: appendSocial, remove: removeSocial } = useFieldArray({ control: form.control, name: "socialMedia" });


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

  const handleImageUpload = async (file: File, fieldName: any) => {
    if (!user) return;
    const toastId = toast({ title: "Uploading image...", description: "Please wait." }).id;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "portfoliohub_preset"); // IMPORTANT: Use your unsigned upload preset name

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      const downloadURL = data.secure_url;

      form.setValue(fieldName, downloadURL);
      
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
                                {field.value && <Image src={field.value} alt="Profile preview" width={64} height={64} className="rounded-full object-cover" />}
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
                         <FormField control={form.control} name="website" render={({ field }) => (
                            <FormItem><FormLabel>Website</FormLabel><FormControl><Input placeholder="https://your-website.com" {...field} /></FormControl><FormMessage /></FormItem>
                         )}/>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Social Media</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        {socialFields.map((item, index) => (
                            <div key={item.id} className="space-y-4 p-4 border rounded-md relative">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold capitalize">{item.platform || `Link ${index+1}`}</h3>
                                    <Button type="button" variant="destructive" size="icon" className="h-6 w-6" onClick={() => removeSocial(index)}>
                                        <Trash2 className="h-4 w-4"/> <span className="sr-only">Remove Social Media</span>
                                    </Button>
                                </div>
                                <FormField control={form.control} name={`socialMedia.${index}.platform`} render={({field}) => (
                                    <FormItem><FormLabel>Platform</FormLabel><FormControl>
                                      <select {...field} className="w-full p-2 border rounded-md bg-background">
                                        <option value="linkedin">LinkedIn</option>
                                        <option value="github">GitHub</option>
                                        <option value="twitter">Twitter</option>
                                        <option value="instagram">Instagram</option>
                                        <option value="facebook">Facebook</option>
                                        <option value="whatsapp">WhatsApp</option>
                                      </select>
                                    </FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name={`socialMedia.${index}.url`} render={({field}) => (
                                    <FormItem><FormLabel>URL</FormLabel><FormControl><Input {...field} placeholder="https://linkedin.com/in/..." /></FormControl><FormMessage /></FormItem>
                                )}/>
                            </div>
                        ))}
                         <Button type="button" variant="outline" onClick={() => appendSocial({platform: 'linkedin', url: ''})}>
                           <PlusCircle className="mr-2 h-4 w-4"/> Add Social Link
                        </Button>
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
                                        onChange={(e) => field.onChange(e.target.value.split(',').map(skill => skill.trim()).filter(skill => skill))}
                                    />
                                 </FormControl>
                                 <FormMessage />
                            </FormItem>
                        )}/>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Work Experience</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        {workFields.map((item, index) => (
                            <div key={item.id} className="space-y-4 p-4 border rounded-md relative">
                                <Button type="button" variant="destructive" size="icon" className="h-6 w-6 absolute top-4 right-4" onClick={() => removeWork(index)}>
                                    <Trash2 className="h-4 w-4"/> <span className="sr-only">Remove Work Experience</span>
                                </Button>
                                <FormField control={form.control} name={`workExperiences.${index}.company`} render={({field}) => (<FormItem><FormLabel>Company</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={form.control} name={`workExperiences.${index}.role`} render={({field}) => (<FormItem><FormLabel>Role</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <div className="grid grid-cols-2 gap-4">
                                  <FormField control={form.control} name={`workExperiences.${index}.startDate`} render={({field}) => (<FormItem><FormLabel>Start Date</FormLabel><FormControl><Input type="text" placeholder="e.g., Jan 2020" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                  <FormField control={form.control} name={`workExperiences.${index}.endDate`} render={({field}) => (<FormItem><FormLabel>End Date</FormLabel><FormControl><Input type="text" placeholder="e.g., Present" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                </div>
                                <FormField control={form.control} name={`workExperiences.${index}.description`} render={({field}) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            </div>
                        ))}
                         <Button type="button" variant="outline" onClick={() => appendWork({company: '', role: '', startDate: '', endDate: '', description: ''})}>
                           <PlusCircle className="mr-2 h-4 w-4"/> Add Work Experience
                        </Button>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader><CardTitle>Organization Experience</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        {orgFields.map((item, index) => (
                            <div key={item.id} className="space-y-4 p-4 border rounded-md relative">
                                <Button type="button" variant="destructive" size="icon" className="h-6 w-6 absolute top-4 right-4" onClick={() => removeOrg(index)}>
                                    <Trash2 className="h-4 w-4"/> <span className="sr-only">Remove Organization Experience</span>
                                </Button>
                                <FormField control={form.control} name={`organizationExperiences.${index}.organization`} render={({field}) => (<FormItem><FormLabel>Organization</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={form.control} name={`organizationExperiences.${index}.role`} render={({field}) => (<FormItem><FormLabel>Role</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name={`organizationExperiences.${index}.startDate`} render={({field}) => (<FormItem><FormLabel>Start Date</FormLabel><FormControl><Input type="text" placeholder="e.g., Jan 2020" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                    <FormField control={form.control} name={`organizationExperiences.${index}.endDate`} render={({field}) => (<FormItem><FormLabel>End Date</FormLabel><FormControl><Input type="text" placeholder="e.g., Present" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                </div>
                                <FormField control={form.control} name={`organizationExperiences.${index}.description`} render={({field}) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            </div>
                        ))}
                        <Button type="button" variant="outline" onClick={() => appendOrg({organization: '', role: '', startDate: '', endDate: '', description: ''})}>
                           <PlusCircle className="mr-2 h-4 w-4"/> Add Organization Experience
                        </Button>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader><CardTitle>Education</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        {eduFields.map((item, index) => (
                            <div key={item.id} className="space-y-4 p-4 border rounded-md relative">
                                <Button type="button" variant="destructive" size="icon" className="h-6 w-6 absolute top-4 right-4" onClick={() => removeEdu(index)}>
                                    <Trash2 className="h-4 w-4"/> <span className="sr-only">Remove Education</span>
                                </Button>
                                <FormField control={form.control} name={`educations.${index}.institution`} render={({field}) => (<FormItem><FormLabel>Institution</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={form.control} name={`educations.${index}.degree`} render={({field}) => (<FormItem><FormLabel>Degree</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={form.control} name={`educations.${index}.fieldOfStudy`} render={({field}) => (<FormItem><FormLabel>Field of Study</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name={`educations.${index}.startDate`} render={({field}) => (<FormItem><FormLabel>Start Date</FormLabel><FormControl><Input type="text" placeholder="e.g., Aug 2018" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                    <FormField control={form.control} name={`educations.${index}.endDate`} render={({field}) => (<FormItem><FormLabel>End Date</FormLabel><FormControl><Input type="text" placeholder="e.g., May 2022" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                </div>
                            </div>
                        ))}
                        <Button type="button" variant="outline" onClick={() => appendEdu({institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: ''})}>
                           <PlusCircle className="mr-2 h-4 w-4"/> Add Education
                        </Button>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader><CardTitle>Certifications</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        {certFields.map((item, index) => (
                            <div key={item.id} className="space-y-4 p-4 border rounded-md relative">
                                <Button type="button" variant="destructive" size="icon" className="h-6 w-6 absolute top-4 right-4" onClick={() => removeCert(index)}>
                                    <Trash2 className="h-4 w-4"/> <span className="sr-only">Remove Certification</span>
                                </Button>
                                <FormField control={form.control} name={`certifications.${index}.name`} render={({field}) => (<FormItem><FormLabel>Certification Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={form.control} name={`certifications.${index}.issuingOrganization`} render={({field}) => (<FormItem><FormLabel>Issuing Organization</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name={`certifications.${index}.issueDate`} render={({field}) => (<FormItem><FormLabel>Issue Date</FormLabel><FormControl><Input type="text" placeholder="e.g., Jun 2023" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={form.control} name={`certifications.${index}.credentialId`} render={({field}) => (<FormItem><FormLabel>Credential ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                </div>
                            </div>
                        ))}
                        <Button type="button" variant="outline" onClick={() => appendCert({name: '', issuingOrganization: '', issueDate: '', credentialId: ''})}>
                           <PlusCircle className="mr-2 h-4 w-4"/> Add Certification
                        </Button>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader><CardTitle>Courses</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        {courseFields.map((item, index) => (
                            <div key={item.id} className="space-y-4 p-4 border rounded-md relative">
                                <Button type="button" variant="destructive" size="icon" className="h-6 w-6 absolute top-4 right-4" onClick={() => removeCourse(index)}>
                                    <Trash2 className="h-4 w-4"/> <span className="sr-only">Remove Course</span>
                                </Button>
                                <FormField control={form.control} name={`courses.${index}.name`} render={({field}) => (<FormItem><FormLabel>Course Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={form.control} name={`courses.${index}.platform`} render={({field}) => (<FormItem><FormLabel>Platform</FormLabel><FormControl><Input {...field} placeholder="e.g., Coursera, Udemy" /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={form.control} name={`courses.${index}.completionDate`} render={({field}) => (<FormItem><FormLabel>Completion Date</FormLabel><FormControl><Input type="text" placeholder="e.g., Mar 2023" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            </div>
                        ))}
                        <Button type="button" variant="outline" onClick={() => appendCourse({name: '', platform: '', completionDate: ''})}>
                           <PlusCircle className="mr-2 h-4 w-4"/> Add Course
                        </Button>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader><CardTitle>Testimonials</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                        {testimonialFields.map((item, index) => (
                            <div key={item.id} className="space-y-4 p-4 border rounded-md relative">
                                <Button type="button" variant="destructive" size="icon" className="h-6 w-6 absolute top-4 right-4" onClick={() => removeTestimonial(index)}>
                                    <Trash2 className="h-4 w-4"/> <span className="sr-only">Remove Testimonial</span>
                                </Button>
                                <FormField control={form.control} name={`testimonials.${index}.name`} render={({field}) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={form.control} name={`testimonials.${index}.company`} render={({field}) => (<FormItem><FormLabel>Company / Role</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={form.control} name={`testimonials.${index}.feedback`} render={({field}) => (<FormItem><FormLabel>Feedback</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            </div>
                        ))}
                        <Button type="button" variant="outline" onClick={() => appendTestimonial({name: '', company: '', feedback: ''})}>
                           <PlusCircle className="mr-2 h-4 w-4"/> Add Testimonial
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Projects</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {projectFields.map((item, index) => (
                            <div key={item.id} className="space-y-4 p-4 border rounded-md relative">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold">Project {index+1}</h3>
                                    <Button type="button" variant="destructive" size="icon" className="h-6 w-6" onClick={() => removeProject(index)}>
                                        <Trash2 className="h-4 w-4"/>
                                        <span className="sr-only">Remove Project</span>
                                    </Button>
                                </div>
                                <FormField control={form.control} name={`projects.${index}.title`} render={({field}) => (
                                    <FormItem><FormLabel>Project Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                 <FormField control={form.control} name={`projects.${index}.description`} render={({field}) => (
                                    <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name={`projects.${index}.imageUrl`} render={({ field: imageField }) => (
                                    <FormItem>
                                    <FormLabel>Project Image</FormLabel>
                                    <div className="flex items-center gap-4">
                                        {imageField.value && <Image src={imageField.value} alt={`Project ${index + 1} preview`} width={80} height={45} className="rounded-md object-cover" />}
                                        <FormControl>
                                            <Input type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], `projects.${index}.imageUrl`)} className="hidden" id={`project-pic-upload-${index}`}/>
                                        </FormControl>
                                        <Button asChild variant="outline">
                                            <label htmlFor={`project-pic-upload-${index}`} className="cursor-pointer">
                                                <UploadCloud className="mr-2 h-4 w-4"/> Upload
                                            </label>
                                        </Button>
                                    </div>
                                    <Input {...imageField} placeholder="Or paste an image URL" className="mt-2" />
                                    <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name={`projects.${index}.link`} render={({field}) => (
                                    <FormItem><FormLabel>Project Link</FormLabel><FormControl><Input placeholder="https://github.com/..." {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                            </div>
                        ))}
                         <Button type="button" variant="outline" onClick={() => appendProject({title: '', description: '', imageUrl: '', link: ''})}>
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
                        {watchedValues.skills?.map((skill, i) => skill && <span key={i} className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-sm">{skill}</span>)}
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
