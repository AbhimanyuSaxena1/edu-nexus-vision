import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Calendar,
  Users,
  BookOpen,
  BarChart3,
  Video,
  Bell,
  Settings,
  GraduationCap,
  ClipboardList,
  Brain,
  MessageSquare,
  Award,
  Clock,
  UserCheck,
  Lightbulb,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';

const studentItems = [
  { title: 'Dashboard', url: '/dashboard', icon: BarChart3 },
  { title: 'My Courses', url: '/courses', icon: BookOpen },
  { title: 'Attendance', url: '/attendance', icon: UserCheck },
  { title: 'Quizzes', url: '/quizzes', icon: ClipboardList },
  { title: 'Timetable', url: '/timetable', icon: Calendar },
  { title: 'AI Tutor', url: '/ai-tutor', icon: Brain },
  { title: 'Team Finder', url: '/team-finder', icon: Users },
  { title: 'Certifications', url: '/certifications', icon: Award },
  { title: 'Notifications', url: '/notifications', icon: Bell },
];

const teacherItems = [
  { title: 'Dashboard', url: '/dashboard', icon: BarChart3 },
  { title: 'My Classes', url: '/classes', icon: Users },
  { title: 'Live Classroom', url: '/live-classroom', icon: Video },
  { title: 'Attendance Monitor', url: '/attendance-monitor', icon: UserCheck },
  { title: 'Quiz Management', url: '/quiz-management', icon: ClipboardList },
  { title: 'Course Content', url: '/course-content', icon: BookOpen },
  { title: 'Timetable', url: '/timetable', icon: Calendar },
  { title: 'Analytics', url: '/analytics', icon: BarChart3 },
  { title: 'Notifications', url: '/notifications', icon: Bell },
];

const hodItems = [
  { title: 'Dashboard', url: '/dashboard', icon: BarChart3 },
  { title: 'Department Overview', url: '/department', icon: GraduationCap },
  { title: 'Faculty Management', url: '/faculty', icon: Users },
  { title: 'Course Management', url: '/course-management', icon: BookOpen },
  { title: 'Timetable Generation', url: '/timetable-generation', icon: Clock },
  { title: 'Attendance Reports', url: '/attendance-reports', icon: UserCheck },
  { title: 'Academic Analytics', url: '/academic-analytics', icon: BarChart3 },
  { title: 'Resource Allocation', url: '/resources', icon: Settings },
  { title: 'Notifications', url: '/notifications', icon: Bell },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { profile } = useAuth();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';

  const getMenuItems = () => {
    switch (profile?.role) {
      case 'teacher':
        return teacherItems;
      case 'hod':
      case 'admin':
        return hodItems;
      case 'student':
      default:
        return studentItems;
    }
  };

  const menuItems = getMenuItems();
  const isActive = (path: string) => currentPath === path;
  const isExpanded = menuItems.some((item) => isActive(item.url));

  return (
    <Sidebar
      className={collapsed ? 'w-14' : 'w-64'}
    >
      <SidebarContent>
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center space-x-3">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
              <GraduationCap className="h-6 w-6" />
            </div>
            {!collapsed && (
              <div>
                <h2 className="font-bold text-lg text-sidebar-foreground">ATTENDEX</h2>
                <p className="text-xs text-sidebar-foreground/60 capitalize">
                  {profile?.role} Portal
                </p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>
            {profile?.role === 'teacher' ? 'Teaching Tools' : 
             profile?.role === 'hod' || profile?.role === 'admin' ? 'Management' : 
             'Learning Hub'}
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                          : 'hover:bg-sidebar-accent/50 text-sidebar-foreground'
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && (
          <div className="mt-auto p-4 border-t border-sidebar-border">
            <div className="flex items-center space-x-3">
              <div className="bg-accent text-accent-foreground p-2 rounded-full text-xs font-medium">
                {profile?.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-sidebar-foreground">{profile?.full_name}</p>
                <p className="text-xs text-sidebar-foreground/60">{profile?.email}</p>
              </div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}