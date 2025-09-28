import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FileText, Video, Upload, MoreHorizontal } from 'lucide-react';

const content = [
  { id: 'CNT01', name: 'Lecture 1 Notes.pdf', type: 'PDF', course: 'Data Structures', size: '1.2 MB', uploaded: '2 days ago' },
  { id: 'CNT02', name: 'Intro to Stacks.mp4', type: 'Video', course: 'Data Structures', size: '45.8 MB', uploaded: '2 days ago' },
  { id: 'CNT03', name: 'Assignment 1.docx', type: 'Assignment', course: 'Algorithms', size: '88 KB', uploaded: '1 day ago' },
  { id: 'CNT04', name: 'OS Scheduling.pdf', type: 'PDF', course: 'Operating Systems', size: '2.5 MB', uploaded: '5 hours ago' },
];

export default function CourseContent() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Course Content</h1>
          <p className="text-muted-foreground">Manage and upload materials for your courses.</p>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Content
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Content Library</CardTitle>
          <CardDescription>All your uploaded course materials.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {content.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium flex items-center">
                    {item.type === 'PDF' ? <FileText className="mr-2 h-4 w-4 text-muted-foreground" /> : <Video className="mr-2 h-4 w-4 text-muted-foreground" />}
                    {item.name}
                  </TableCell>
                  <TableCell>{item.course}</TableCell>
                  <TableCell>{item.size}</TableCell>
                  <TableCell>{item.uploaded}</TableCell>
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