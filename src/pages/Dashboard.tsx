import { useAuth } from '@/hooks/useAuth';
import { StudentDashboard } from '@/components/dashboards/StudentDashboard';
import { TeacherDashboard } from '@/components/dashboards/TeacherDashboard';
import { HODDashboard } from '@/components/dashboards/HODDashboard';

function LoadingSpinner() {
  return (
    <div className="flex h-full min-h-[calc(100vh-200px)] w-full items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Loading Dashboard...</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { profile, loading } = useAuth();

  const renderDashboard = () => {
    if (loading || !profile) {
      return <LoadingSpinner />;
    }

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
    <div className="container mx-auto flex-grow p-6">
      {renderDashboard()}
    </div>
  );
}