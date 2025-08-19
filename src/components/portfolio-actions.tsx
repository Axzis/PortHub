
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function PortfolioActions() {
    const [isDownloading, setIsDownloading] = useState(false);
    const { toast } = useToast();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleDownloadPdf = async () => {
        setIsDownloading(true);
        toast({ title: 'Generating PDF...', description: 'Please wait, this may take a moment.' });
        try {
            const { default: html2canvas } = await import('html2canvas');
            const { default: jsPDF } = await import('jspdf');

            const element = document.getElementById('portfolio-content');
            if (!element) {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not find portfolio content.' });
                setIsDownloading(false);
                return;
            }

            const canvas = await html2canvas(element, {
                 scale: 2, 
                 useCORS: true,
                 backgroundColor: window.getComputedStyle(document.body).backgroundColor,
            });
            const imgData = canvas.toDataURL('image/png');
            
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save('portfolio.pdf');
            toast({ title: 'Success!', description: 'Your PDF has been downloaded.' });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate PDF.' });
        } finally {
            setIsDownloading(false);
        }
    };
    
    if (!isClient) {
        return null;
    }

    return (
        <div className="fixed bottom-8 right-8 z-50">
            <Button onClick={handleDownloadPdf} disabled={isDownloading} size="lg" className="rounded-full shadow-lg">
                {isDownloading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Download className="mr-2 h-4 w-4" />
                )}
                Download as PDF
            </Button>
        </div>
    );
}
