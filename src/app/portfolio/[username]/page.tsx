
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Linkedin, Github, Twitter, Quote, Calendar, Building, GraduationCap, Award, BookOpen, Briefcase, Users, Instagram, Facebook, MessageCircle } from 'lucide-react';
import { PortfolioActions } from '@/components/portfolio-actions';
import { AOSInitializer } from '@/components/AOSInitializer';
import { cn } from '@/lib/utils';

async function getPortfolioData(username: string) {
    const q = query(collection(db, "users"), where("username", "==", username.toLowerCase()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return null;
    }

    const userDoc = querySnapshot.docs[0];
    const uid = userDoc.id;

    const portfolioDocRef = doc(db, "portfolios", uid);
    const portfolioSnap = await getDoc(portfolioDocRef);
    
    if (!portfolioSnap.exists()) {
        return null;
    }

    return portfolioSnap.data();
}

const SocialIcon = ({ platform }: { platform: string }) => {
    switch (platform) {
        case 'linkedin': return <Linkedin className="h-5 w-5" />;
        case 'github': return <Github className="h-5 w-5" />;
        case 'twitter': return <Twitter className="h-5 w-5" />;
        case 'instagram': return <Instagram className="h-5 w-5" />;
        case 'facebook': return <Facebook className="h-5 w-5" />;
        case 'whatsapp': return <MessageCircle className="h-5 w-5" />;
        default: return <Globe className="h-5 w-5" />;
    }
};

export default async function PortfolioPage({ params }: { params: { username: string } }) {
    const portfolioData = await getPortfolioData(params.username);

    if (!portfolioData) {
        notFound();
    }

    const { 
        fullName, title, bio, profilePictureUrl, profilePictureShape, textAlign, theme, website,
        skills = [], 
        projects = [],
        workExperiences = [],
        organizationExperiences = [],
        educations = [],
        certifications = [],
        courses = [],
        testimonials = [],
        socialMedia = [],
    } = portfolioData;

    return (
        <div className={cn("bg-background min-h-screen", theme)}>
            <AOSInitializer />
            <div id="portfolio-content" className="container mx-auto max-w-4xl p-4 sm:p-8 md:p-12 bg-background text-foreground">
                <header className={cn("flex flex-col items-center gap-8 mb-12", {
                    'sm:flex-row sm:text-left': textAlign === 'text-left',
                    'sm:flex-col sm:text-center': textAlign === 'text-center' || textAlign === 'text-right',
                })}>
                     <div className="relative" data-aos="fade-down">
                        <Image
                            src={profilePictureUrl || "https://placehold.co/128x128.png"}
                            alt={fullName || 'Profile Picture'}
                            width={128}
                            height={128}
                            className={cn("object-cover border-4 border-card shadow-md w-32 h-32", profilePictureShape || 'rounded-full')}
                            data-ai-hint="profile person"
                         />
                     </div>
                     <div className={cn(textAlign, "w-full")} data-aos="fade-up">
                        <h1 className="text-4xl font-bold font-headline">{fullName || "Your Name"}</h1>
                        <p className="text-xl text-muted-foreground mt-1">{title || "Your Title"}</p>
                        <p className="mt-4 max-w-prose text-foreground/80 mx-auto sm:mx-0">{bio || "Your biography will be displayed here."}</p>
                        <div className={cn("flex items-center gap-4 mt-4", {
                            'justify-start': textAlign === 'text-left',
                            'justify-center': textAlign === 'text-center',
                            'sm:justify-end': textAlign === 'text-right',
                            'justify-center sm:justify-start': !textAlign || textAlign === 'text-left',
                         })}>
                            {website && (
                                <Link href={website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm font-semibold text-accent hover:underline">
                                    <Globe className="mr-2 h-4 w-4" />
                                    Website
                                </Link>
                            )}
                            {socialMedia.map((social: any) => (
                                <Link key={social.platform} href={social.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-accent">
                                    <SocialIcon platform={social.platform} />
                                </Link>
                            ))}
                        </div>
                     </div>
                </header>
                
                <main className="space-y-16">
                    {skills.length > 0 && (
                        <section id="skills" data-aos="fade-up">
                            <h2 className="text-3xl font-bold font-headline text-center mb-8">Skills</h2>
                            <div className="flex flex-wrap justify-center gap-3">
                                {skills.map((skill: any, index: number) => (
                                    <Badge key={index} variant="secondary" className="text-base px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20" data-aos="zoom-in" data-aos-delay={index * 50}>
                                        {skill.name}
                                    </Badge>
                                ))}
                            </div>
                        </section>
                    )}

                    {workExperiences.length > 0 && (
                        <section id="work-experience" data-aos="fade-up">
                            <h2 className="text-3xl font-bold font-headline text-center mb-8">Work Experience</h2>
                            <div className="relative border-l-2 border-primary/20 pl-8 space-y-10">
                                {workExperiences.map((exp: any, index: number) => (
                                    <div key={index} className="relative" data-aos="fade-left" data-aos-delay={index * 100}>
                                        <div className="absolute -left-[42px] top-1.5 h-4 w-4 rounded-full bg-primary" />
                                        <p className="text-sm text-muted-foreground"><Briefcase className="inline-block mr-2 h-4 w-4" />{exp.startDate} - {exp.endDate || 'Present'}</p>
                                        <h3 className="text-xl font-bold">{exp.role}</h3>
                                        <p className="text-md text-accent">{exp.company}</p>
                                        <p className="mt-2 text-foreground/80">{exp.description}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {organizationExperiences.length > 0 && (
                        <section id="organization-experience" data-aos="fade-up">
                            <h2 className="text-3xl font-bold font-headline text-center mb-8">Organization Experience</h2>
                            <div className="relative border-l-2 border-primary/20 pl-8 space-y-10">
                                {organizationExperiences.map((exp: any, index: number) => (
                                    <div key={index} className="relative" data-aos="fade-left" data-aos-delay={index * 100}>
                                        <div className="absolute -left-[42px] top-1.5 h-4 w-4 rounded-full bg-primary" />
                                        <p className="text-sm text-muted-foreground"><Users className="inline-block mr-2 h-4 w-4" />{exp.startDate} - {exp.endDate || 'Present'}</p>
                                        <h3 className="text-xl font-bold">{exp.role}</h3>
                                        <p className="text-md text-accent">{exp.organization}</p>
                                        <p className="mt-2 text-foreground/80">{exp.description}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {educations.length > 0 && (
                        <section id="education" data-aos="fade-up">
                            <h2 className="text-3xl font-bold font-headline text-center mb-8">Education</h2>
                            <div className="relative border-l-2 border-primary/20 pl-8 space-y-10">
                                {educations.map((edu: any, index: number) => (
                                    <div key={index} className="relative" data-aos="fade-left" data-aos-delay={index * 100}>
                                        <div className="absolute -left-[42px] top-1.5 h-4 w-4 rounded-full bg-primary" />
                                        <p className="text-sm text-muted-foreground"><Calendar className="inline-block mr-2 h-4 w-4" />{edu.startDate} - {edu.endDate || 'Present'}</p>
                                        <h3 className="text-xl font-bold">{edu.degree}</h3>
                                        {edu.fieldOfStudy && <p className="text-md text-muted-foreground">{edu.fieldOfStudy}</p>}
                                        <p className="text-md text-accent">{edu.institution}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {certifications.length > 0 && (
                        <section id="certifications" data-aos="fade-up">
                            <h2 className="text-3xl font-bold font-headline text-center mb-8">Certifications</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {certifications.map((cert: any, index: number) => (
                                    <Card key={index} className="p-6 flex items-start gap-4" data-aos="fade-up" data-aos-delay={index * 100}>
                                        <div className="bg-primary/10 text-primary p-3 rounded-full"><Award className="h-6 w-6"/></div>
                                        <div>
                                            <h3 className="font-bold text-lg">{cert.name}</h3>
                                            <p className="text-muted-foreground">{cert.issuingOrganization}</p>
                                            {cert.issueDate && <p className="text-sm text-muted-foreground mt-1">Issued {cert.issueDate}</p>}
                                            {cert.credentialId && <p className="text-sm text-muted-foreground">ID: {cert.credentialId}</p>}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </section>
                    )}
                    
                    {courses.length > 0 && (
                        <section id="courses" data-aos="fade-up">
                            <h2 className="text-3xl font-bold font-headline text-center mb-8">Courses</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {courses.map((course: any, index: number) => (
                                    <Card key={index} className="p-6 flex items-start gap-4" data-aos="fade-up" data-aos-delay={index * 100}>
                                        <div className="bg-primary/10 text-primary p-3 rounded-full"><BookOpen className="h-6 w-6"/></div>
                                        <div>
                                            <h3 className="font-bold text-lg">{course.name}</h3>
                                            {course.platform && <p className="text-muted-foreground">{course.platform}</p>}
                                            {course.completionDate && <p className="text-sm text-muted-foreground mt-1">Completed {course.completionDate}</p>}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </section>
                    )}

                    {testimonials.length > 0 && (
                        <section id="testimonials" data-aos="fade-up">
                            <h2 className="text-3xl font-bold font-headline text-center mb-8">Testimonials</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {testimonials.map((testimonial: any, index: number) => (
                                    <Card key={index} className="p-6" data-aos="fade-up" data-aos-delay={index * 100}>
                                        <Quote className="h-8 w-8 text-primary mb-4" />
                                        <p className="text-foreground/80 mb-4 italic">"{testimonial.feedback}"</p>
                                        <p className="font-bold text-right">{testimonial.name}</p>
                                        {testimonial.company && <p className="text-muted-foreground text-sm text-right">{testimonial.company}</p>}
                                    </Card>
                                ))}
                            </div>
                        </section>
                    )}

                    {projects.length > 0 && (
                        <section id="projects">
                            <h2 className="text-3xl font-bold font-headline text-center mb-8" data-aos="fade-up">Projects</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {projects.map((project: any, index: number) => (
                                    <Card key={index} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300" data-aos="fade-up" data-aos-delay={index * 100}>
                                        {project.imageUrl && (
                                            <Image 
                                                src={project.imageUrl}
                                                alt={project.title}
                                                width={500}
                                                height={300}
                                                className="w-full h-48 object-cover"
                                                data-ai-hint="project technology"
                                            />
                                        )}
                                        <CardHeader>
                                            <CardTitle>{project.title}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-muted-foreground mb-4">{project.description}</p>
                                            {project.link && (
                                                <Link href={project.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm font-semibold text-accent hover:underline">
                                                    <Globe className="mr-2 h-4 w-4" />
                                                    View Project
                                                </Link>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </section>
                    )}
                </main>
            </div>
            <PortfolioActions />
        </div>
    );
}
