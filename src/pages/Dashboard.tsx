import { useAuth } from '@/hooks/useAuth';
import { StudentDashboard } from '@/components/dashboards/StudentDashboard';
import { TeacherDashboard } from '@/components/dashboards/TeacherDashboard';
import { HODDashboard } from '@/components/dashboards/HODDashboard';

export default function Dashboard() {
  const { profile } = useAuth();

  const renderDashboard = () => {
    switch (profile?.role) {
      case 'student':
        return <StudentDashboard />;
      case 'teacher':
        return <TeacherDashboard />;
      case 'hod':
      case 'admin':
        return <HODDashboard />;
      default:
        return <StudentDashboard />;
    }
  };

  return (
    <div className="container mx-auto p-6">
      {renderDashboard()}
    </div>
  );
}