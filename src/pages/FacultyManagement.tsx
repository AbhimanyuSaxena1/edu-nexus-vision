import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreHorizontal, UserPlus } from 'lucide-react';

const faculty = [
  { id: 'F001', name: 'Dr. Sarah Johnson', email: 'sarah.j@example.com', role: 'Professor', courses: 4, status: 'Active' },
  { id: 'F002', name: 'Prof. Michael Wilson', email: 'michael.w@example.com', role: 'Associate Professor', courses: 3, status: 'On Leave' },
  { id: 'F003', name: 'Dr. Alice Brown', email: 'alice.b@example.com', role: 'Assistant Professor', courses: 2, status: 'Active' },
  { id: 'F004', name: 'Dr. Robert Davis', email: 'robert.d@example.com', role: 'Professor', courses: 5, status: 'Active' },
];

export default function FacultyManagement() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Faculty Management</h1>
          <p className="text-muted-foreground">View, add, and manage faculty members.</p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Faculty
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Faculty List</CardTitle>
          <CardDescription>A list of all faculty in the department.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Courses Taught</TableHead>
                <TableHead>Status</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {faculty.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={`https://api.dicebear.com/8.x/initials/svg?seed=${member.name}`} />
                        <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{member.role}</TableCell>
                  <TableCell>{member.courses}</TableCell>
                  <TableCell>
                    <Badge variant={member.status === 'Active' ? 'default' : 'secondary'}>{member.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}