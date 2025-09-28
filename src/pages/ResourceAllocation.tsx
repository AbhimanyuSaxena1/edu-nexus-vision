import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal } from 'lucide-react';

const resources = [
  { id: 'R001', name: 'Room 301', type: 'Classroom', capacity: 60, utilization: '85%', status: 'In Use' },
  { id: 'R002', name: 'Lab 1 (CS)', type: 'Computer Lab', capacity: 40, utilization: '95%', status: 'In Use' },
  { id: 'R003', name: 'Room 302', type: 'Classroom', capacity: 60, utilization: '40%', status: 'Available' },
  { id: 'R004', name: 'Seminar Hall A', type: 'Hall', capacity: 120, utilization: '15%', status: 'Available' },
];

export default function ResourceAllocation() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Resource Allocation</h1>
          <p className="text-muted-foreground">Manage and view classroom and lab usage.</p>
        </div>
        <Button variant="outline">
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Manage Allocations
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resource Utilization</CardTitle>
          <CardDescription>Current status and utilization of all rooms.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resource</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Current Utilization</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resources.map((resource) => (
                <TableRow key={resource.id}>
                  <TableCell className="font-medium">{resource.name}</TableCell>
                  <TableCell>{resource.type}</TableCell>
                  <TableCell>{resource.capacity}</TableCell>
                  <TableCell>{resource.utilization}</TableCell>
                  <TableCell>
                    <Badge variant={resource.status === 'In Use' ? 'destructive' : 'default'}>
                      {resource.status}
                    </Badge>
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