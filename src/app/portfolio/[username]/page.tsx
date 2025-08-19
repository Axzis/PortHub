
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe } from 'lucide-react';
import { PortfolioActions } from '@/components/portfolio-actions';

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


export default async function PortfolioPage({ params }: { params: { username: string } }) {
    const portfolioData = await getPortfolioData(params.username);

    if (!portfolioData) {
        notFound();
    }

    const { fullName, title, bio, profilePictureUrl, skills = [], projects = [] } = portfolioData;

    return (
        <div className="bg-background min-h-screen">
            <div id="portfolio-content" className="container mx-auto max-w-4xl p-4 sm:p-8 md:p-12">
                <header className="flex flex-col sm:flex-row items-center gap-8 mb-12">
                     <div className="relative">
                        <Image
                            src={profilePictureUrl || "https://placehold.co/128x128.png"}
                            alt={fullName || 'Profile Picture'}
                            width={128}
                            height={128}
                            className="rounded-full object-cover border-4 border-card shadow-md"
                            data-ai-hint="profile person"
                         />
                     </div>
                     <div className="text-center sm:text-left">
                        <h1 className="text-4xl font-bold font-headline">{fullName || "Your Name"}</h1>
                        <p className="text-xl text-muted-foreground mt-1">{title || "Your Title"}</p>
                        <p className="mt-4 max-w-prose text-foreground/80">{bio || "Your biography will be displayed here."}</p>
                     </div>
                </header>
                
                <main className="space-y-16">
                    <section id="skills">
                        <h2 className="text-3xl font-bold font-headline text-center mb-8">Skills</h2>
                        <div className="flex flex-wrap justify-center gap-3">
                            {skills.map((skill: string) => (
                                <Badge key={skill} variant="secondary" className="text-base px-4 py-2 bg-accent/10 text-accent hover:bg-accent/20 border border-accent/20">
                                    {skill}
                                </Badge>
                            ))}
                        </div>
                    </section>

                    <section id="projects">
                        <h2 className="text-3xl font-bold font-headline text-center mb-8">Projects</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {projects.map((project: any, index: number) => (
                                <Card key={index} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
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
                </main>
            </div>
            <PortfolioActions />
        </div>
    );
}
