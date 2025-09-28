import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Calendar, AlertTriangle } from 'lucide-react';

const notifications = [
  { id: 1, icon: Calendar, title: 'Timetable Published', message: 'The timetable for the Fall 2024 semester has been published.', time: '2 days ago', read: true },
  { id: 2, icon: AlertTriangle, title: 'Attendance Alert: CS301', message: '3 students have attendance below 75%.', time: '1 day ago', read: false },
  { id: 3, icon: Bell, title: 'New Faculty Member Added', message: 'Dr. Emily Carter has joined the Computer Science department.', time: '5 hours ago', read: false },
];

export default function NotificationsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Notifications</h1>

      <Card>
        <CardHeader>
          <CardTitle>Recent Updates</CardTitle>
          <CardDescription>All your notifications in one place.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start space-x-4 p-4 rounded-lg border ${
                  notification.read ? 'bg-muted/50' : 'bg-accent/50'
                }`}
              >
                <notification.icon className={`h-6 w-6 mt-1 ${notification.read ? 'text-muted-foreground' : 'text-primary'}`} />
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className={`font-medium ${notification.read ? 'text-muted-foreground' : ''}`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{notification.time}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}