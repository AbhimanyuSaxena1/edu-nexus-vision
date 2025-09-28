import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Download } from 'lucide-react';

const certifications = [
  { id: 1, name: 'React Basics', issuer: 'Coursera', date: '2023-05-20' },
  { id: 2, name: 'Python for Everybody', issuer: 'University of Michigan', date: '2023-08-15' },
];

export default function CertificationsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">My Certifications</h1>
      <p className="text-muted-foreground">A collection of your earned certificates.</p>

      <div className="grid gap-6 md:grid-cols-2">
        {certifications.map((cert) => (
          <Card key={cert.id}>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Award className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>{cert.name}</CardTitle>
                  <CardDescription>Issued by {cert.issuer} on {cert.date}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download Certificate
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}