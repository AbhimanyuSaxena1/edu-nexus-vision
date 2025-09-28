import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthPage } from "@/components/auth/AuthPage";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import DepartmentOverview from "./pages/DepartmentOverview";
import FacultyManagement from "./pages/FacultyManagement";
import CourseManagement from "./pages/CourseManagement";
import TimetableGeneration from "./pages/TimetableGeneration";
import AttendanceReports from "./pages/AttendanceReports";
import AcademicAnalytics from "./pages/AcademicAnalytics";
import ResourceAllocation from "./pages/ResourceAllocation";
import NotificationsPage from "./pages/NotificationsPage";
import MyCourses from "./pages/MyCourses";
import AttendancePage from "./pages/AttendancePage";
import QuizzesPage from "./pages/QuizzesPage";
import TimetablePage from "./pages/TimetablePage";
import AITutorPage from "./pages/AITutorPage";
import TeamFinderPage from "./pages/TeamFinderPage";
import CertificationsPage from "./pages/CertificationsPage";
import MyClasses from "./pages/MyClasses";
import LiveClassroom from "./pages/LiveClassroom";
import AttendanceMonitor from "./pages/AttendanceMonitor";
import QuizManagement from "./pages/QuizManagement";
import CourseContent from "./pages/CourseContent";
import AnalyticsPage from "./pages/AnalyticsPage";
import ProfileSettingsPage from "./ProfileSettingsPage";
import ManualAttendancePage from "./ManualAttendancePage";
import TakeQuizPage from "./pages/TakeQuizPage";
import SmartCoursesPage from "./components/dashboards/SmartCoursesPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="attendex-ui-theme">
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
              <Route path="/courses" element={<AppLayout><MyCourses /></AppLayout>} />
              <Route path="/attendance" element={<AppLayout><AttendancePage /></AppLayout>} />
              <Route path="/quizzes" element={<AppLayout><QuizzesPage /></AppLayout>} />
              <Route path="/quiz/:quizId" element={<AppLayout><TakeQuizPage /></AppLayout>} />
              <Route path="/timetable" element={<AppLayout><TimetablePage /></AppLayout>} />
              <Route path="/ai-tutor" element={<AppLayout><AITutorPage /></AppLayout>} />
              <Route path="/smart-courses" element={<AppLayout><SmartCoursesPage /></AppLayout>} />
              <Route path="/team-finder" element={<AppLayout><TeamFinderPage /></AppLayout>} />
              <Route path="/certifications" element={<AppLayout><CertificationsPage /></AppLayout>} />
              <Route path="/notifications" element={<AppLayout><NotificationsPage /></AppLayout>} />
              <Route path="/classes" element={<AppLayout><MyClasses /></AppLayout>} />
              <Route path="/live-classroom" element={<AppLayout><LiveClassroom /></AppLayout>} />
              <Route path="/attendance-monitor" element={<AppLayout><AttendanceMonitor /></AppLayout>} />
              <Route path="/quiz-management" element={<AppLayout><QuizManagement /></AppLayout>} />
              <Route path="/manual-attendance" element={<AppLayout><ManualAttendancePage /></AppLayout>} />
              <Route path="/course-content" element={<AppLayout><CourseContent /></AppLayout>} />
              <Route path="/analytics" element={<AppLayout><AnalyticsPage /></AppLayout>} />
              <Route path="/profile-settings" element={<AppLayout><ProfileSettingsPage /></AppLayout>} />
              <Route path="/department" element={<AppLayout><DepartmentOverview /></AppLayout>} />
              <Route path="/faculty" element={<AppLayout><FacultyManagement /></AppLayout>} />
              <Route path="/course-management" element={<AppLayout><CourseManagement /></AppLayout>} />
              <Route path="/timetable-generation" element={<AppLayout><TimetableGeneration /></AppLayout>} />
              <Route path="/attendance-reports" element={<AppLayout><AttendanceReports /></AppLayout>} />
              <Route path="/academic-analytics" element={<AppLayout><AcademicAnalytics /></AppLayout>} />
              <Route path="/resources" element={<AppLayout><ResourceAllocation /></AppLayout>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
