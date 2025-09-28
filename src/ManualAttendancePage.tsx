import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { UserCheck, UserX, Clock, Send, BookOpen } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const teacherClasses = [
  { id: 'CLS001', name: 'Data Structures', courseCode: 'CS203' },
  { id: 'CLS002', name: 'Algorithms', courseCode: 'CS301' },
  { id: 'CLS003', name: 'Operating Systems', courseCode: 'CS405' },
];

const studentsByClass: { [key: string]: { id: string; name: string; roll: string }[] } = {
    CLS001: Array.from({ length: 45 }, (_, i) => ({ id: `S${101 + i}`, name: ['Aarav Sharma', 'Vivaan Gupta', 'Aditya Singh', 'Vihaan Kumar', 'Arjun Patel', 'Sai Shah', 'Reyansh Joshi', 'Ayaan Reddy', 'Krishna Rao', 'Ishaan Naidu', 'Rohan Iyer', 'Aryan Menon', 'Ryan Nair', 'Veer Pillai', 'Aadi Khan', 'Shaurya Ahmed', 'Atharv Ali', 'Kabir Hussain', 'Dhruv Sheikh', 'Ritvik Mishra', 'Advik Pandey', 'Dev Tiwari', 'Ansh Shukla', 'Arnav Dubey', 'Ishan Yadav', 'Kian Maurya', 'Om Prasad', 'Parth Chauhan', 'Pranav Rathore', 'Samar Sisodia', 'Siddharth Gehlot', 'Yash Pilot', 'Aaryan Scindia', 'Darsh Pawar', 'Jay Deshmukh', 'Krish Patil', 'Mohammed Gaikwad', 'Neel Jadhav', 'Raj Bose', 'Samarth Ghosh', 'Shaan Mukherjee', 'Shiv Banerjee', 'Soham Chatterjee', 'Ved Mehta', 'Zain Kapoor'][i], roll: `R${101 + i}` })),
    CLS002: Array.from({ length: 45 }, (_, i) => ({ id: `S${201 + i}`, name: ['Aanya Reddy', 'Myra Rao', 'Saanvi Naidu', 'Ananya Iyer', 'Diya Menon', 'Pari Nair', 'Riya Pillai', 'Ira Khan', 'Siya Ahmed', 'Anika Ali', 'Navya Hussain', 'Kiara Sheikh', 'Anvi Mishra', 'Sia Pandey', 'Prisha Tiwari', 'Ishani Shukla', 'Mishka Dubey', 'Amaira Yadav', 'Aditi Maurya', 'Zara Prasad', 'Avni Chauhan', 'Ahaana Rathore', 'Eva Sisodia', 'Shanaya Gehlot', 'Kyra Pilot', 'Anaya Scindia', 'Aarohi Pawar', 'Amara Deshmukh', 'Navya Patil', 'Samaira Gaikwad', 'Suhana Jadhav', 'Tara Bose', 'Vanya Ghosh', 'Yashvi Mukherjee', 'Zoya Banerjee', 'Aadhya Chatterjee', 'Aaradhya Mehta', 'Aashi Kapoor', 'Advika Sharma', 'Alia Gupta', 'Amrita Singh', 'Anahita Kumar', 'Angel Patel', 'Anushka Shah', 'Arya Joshi'][i], roll: `R${201 + i}` })),
    CLS003: Array.from({ length: 45 }, (_, i) => ({ id: `S${301 + i}`, name: ['Arnav Kumar', 'Reyansh Patel', 'Aarav Shah', 'Vihaan Joshi', 'Aditya Reddy', 'Sai Rao', 'Vivaan Naidu', 'Arjun Iyer', 'Ishaan Menon', 'Dhruv Nair', 'Kabir Pillai', 'Atharv Khan', 'Shaurya Ahmed', 'Aadi Ali', 'Veer Hussain', 'Ryan Sheikh', 'Aryan Mishra', 'Rohan Pandey', 'Krishna Tiwari', 'Ayaan Shukla', 'Ritvik Dubey', 'Advik Yadav', 'Ansh Maurya', 'Dev Prasad', 'Ishan Chauhan', 'Kian Rathore', 'Om Sisodia', 'Parth Gehlot', 'Pranav Pilot', 'Samar Scindia', 'Siddharth Pawar', 'Yash Deshmukh', 'Aaryan Patil', 'Darsh Gaikwad', 'Jay Jadhav', 'Krish Bose', 'Mohammed Ghosh', 'Neel Mukherjee', 'Raj Banerjee', 'Samarth Chatterjee', 'Shaan Mehta', 'Shiv Kapoor', 'Soham Sharma', 'Ved Gupta', 'Zain Singh'][i], roll: `R${301 + i}` })),
};

type AttendanceStatus = 'present' | 'absent' | 'late';

export default function ManualAttendancePage() {
  const [selectedClass, setSelectedClass] = useState<string | undefined>();
  const [attendance, setAttendance] = useState<{ [studentId: string]: AttendanceStatus }>({});
  const { toast } = useToast();

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    const initialAttendance = studentsByClass[classId].reduce((acc, student) => {
      acc[student.id] = 'present'; // Default to 'present'
      return acc;
    }, {} as { [studentId:string]: AttendanceStatus });
    setAttendance(initialAttendance);
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = () => {
    console.log('Submitting attendance:', { classId: selectedClass, attendance });
    toast({
      title: 'Attendance Submitted',
      description: `Attendance for ${teacherClasses.find(c => c.id === selectedClass)?.name} has been recorded.`,
    });
  };

  const students = selectedClass ? studentsByClass[selectedClass] : [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <UserCheck className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Manual Attendance</h1>
          <p className="text-muted-foreground">Mark student attendance for your classes.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select a Class</CardTitle>
          <div className="w-full md:w-1/3">
            <Select onValueChange={handleClassChange} value={selectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Select a class to start..." />
              </SelectTrigger>
              <SelectContent>
                {teacherClasses.map(cls => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name} ({cls.courseCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        {selectedClass && (
          <>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll No.</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map(student => (
                    <TableRow key={student.id}>
                      <TableCell>{student.roll}</TableCell>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell className="text-right">
                        <RadioGroup
                          value={attendance[student.id]}
                          onValueChange={(value) => handleStatusChange(student.id, value as AttendanceStatus)}
                          className="flex justify-end space-x-4"
                        >
                          <div className="flex items-center space-x-2"><RadioGroupItem value="present" id={`${student.id}-present`} /><Label htmlFor={`${student.id}-present`} className="text-green-600">Present</Label></div>
                          <div className="flex items-center space-x-2"><RadioGroupItem value="absent" id={`${student.id}-absent`} /><Label htmlFor={`${student.id}-absent`} className="text-red-600">Absent</Label></div>
                          <div className="flex items-center space-x-2"><RadioGroupItem value="late" id={`${student.id}-late`} /><Label htmlFor={`${student.id}-late`} className="text-yellow-600">Late</Label></div>
                        </RadioGroup>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSubmit} className="ml-auto">
                <Send className="mr-2 h-4 w-4" />
                Submit Attendance
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
