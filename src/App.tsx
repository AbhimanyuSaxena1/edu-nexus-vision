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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="attendex-ui-theme">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
              <Route path="/courses" element={<AppLayout><div className="p-6">Courses page coming soon...</div></AppLayout>} />
              <Route path="/attendance" element={<AppLayout><div className="p-6">Attendance page coming soon...</div></AppLayout>} />
              <Route path="/quizzes" element={<AppLayout><div className="p-6">Quizzes page coming soon...</div></AppLayout>} />
              <Route path="/timetable" element={<AppLayout><div className="p-6">Timetable page coming soon...</div></AppLayout>} />
              <Route path="/ai-tutor" element={<AppLayout><div className="p-6">AI Tutor page coming soon...</div></AppLayout>} />
              <Route path="/team-finder" element={<AppLayout><div className="p-6">Team Finder page coming soon...</div></AppLayout>} />
              <Route path="/certifications" element={<AppLayout><div className="p-6">Certifications page coming soon...</div></AppLayout>} />
              <Route path="/notifications" element={<AppLayout><div className="p-6">Notifications page coming soon...</div></AppLayout>} />
              <Route path="/classes" element={<AppLayout><div className="p-6">Classes page coming soon...</div></AppLayout>} />
              <Route path="/live-classroom" element={<AppLayout><div className="p-6">Live Classroom page coming soon...</div></AppLayout>} />
              <Route path="/attendance-monitor" element={<AppLayout><div className="p-6">Attendance Monitor page coming soon...</div></AppLayout>} />
              <Route path="/quiz-management" element={<AppLayout><div className="p-6">Quiz Management page coming soon...</div></AppLayout>} />
              <Route path="/course-content" element={<AppLayout><div className="p-6">Course Content page coming soon...</div></AppLayout>} />
              <Route path="/analytics" element={<AppLayout><div className="p-6">Analytics page coming soon...</div></AppLayout>} />
              <Route path="/department" element={<AppLayout><div className="p-6">Department page coming soon...</div></AppLayout>} />
              <Route path="/faculty" element={<AppLayout><div className="p-6">Faculty page coming soon...</div></AppLayout>} />
              <Route path="/course-management" element={<AppLayout><div className="p-6">Course Management page coming soon...</div></AppLayout>} />
              <Route path="/timetable-generation" element={<AppLayout><div className="p-6">Timetable Generation page coming soon...</div></AppLayout>} />
              <Route path="/attendance-reports" element={<AppLayout><div className="p-6">Attendance Reports page coming soon...</div></AppLayout>} />
              <Route path="/academic-analytics" element={<AppLayout><div className="p-6">Academic Analytics page coming soon...</div></AppLayout>} />
              <Route path="/resources" element={<AppLayout><div className="p-6">Resources page coming soon...</div></AppLayout>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
