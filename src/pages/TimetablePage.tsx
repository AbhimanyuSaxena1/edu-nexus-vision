import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const timeSlots = ['09:00', '10:00', '11:00', '12:00', '01:00', '02:00', '03:00'];

const schedule = {
  'Monday-10:00': { course: 'Advanced Algorithms', room: '301' },
  'Tuesday-11:00': { course: 'Data Visualization', room: 'Lab 2' },
  'Tuesday-02:00': { course: 'Network Security', room: '402' },
  'Wednesday-11:00': { course: 'Data Visualization', room: 'Lab 2' },
  'Thursday-10:00': { course: 'Advanced Algorithms', room: '301' },
  'Friday-02:00': { course: 'Network Security', room: '402' },
};

export default function TimetablePage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Timetable</h1>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  <th className="p-2 border w-24">Time</th>
                  {days.map(day => (
                    <th key={day} className="p-2 border">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map(time => (
                  <tr key={time}>
                    <td className="p-2 border text-center font-medium">{time}</td>
                    {days.map(day => {
                      const key = `${day}-${time}`;
                      const entry = schedule[key];
                      return (
                        <td key={key} className="p-2 border h-24 align-top">
                          {entry && (
                            <div className="bg-primary/10 p-2 rounded-md h-full">
                              <p className="font-bold text-sm">{entry.course}</p>
                              <p className="text-xs text-muted-foreground">Room: {entry.room}</p>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}