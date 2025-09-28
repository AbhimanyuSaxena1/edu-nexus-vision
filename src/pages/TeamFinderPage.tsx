import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, UserPlus } from 'lucide-react';

const availableStudents = [
  { name: 'Abhimanyu Saxena', skills: ['React', 'Node.js'] },
  { name: 'Ayush Prajapat', skills: ['Python', 'Data Science'] },
  { name: 'Sambhav Surana', skills: ['Java', 'Spring'] },
  { name: 'Ashlesha Panda', skills: ['Java', 'Spring'] },
  { name: 'Piyush Nagar', skills: ['Java', 'Spring'] },
  { name: 'Devanshu Kothari', skills: ['Python', 'Data Science'] },
  { name: 'Adamya Gupta', skills: ['Ui/ux', 'Data Science'] },

];

export default function TeamFinderPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Team Finder</h1>
        <Button><UserPlus className="mr-2 h-4 w-4" /> Create a Project</Button>
      </div>
      <p className="text-muted-foreground">Find classmates to collaborate on projects.</p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {availableStudents.map((student) => (
          <Card key={student.name}>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src={`https://api.dicebear.com/8.x/initials/svg?seed=${student.name}`} />
                  <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <CardTitle>{student.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium mb-2">Skills:</p>
              <div className="flex flex-wrap gap-2">
                {student.skills.map(skill => <span key={skill} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">{skill}</span>)}
              </div>
              <Button variant="outline" className="w-full mt-4"><Users className="mr-2 h-4 w-4" /> Invite to Team</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}