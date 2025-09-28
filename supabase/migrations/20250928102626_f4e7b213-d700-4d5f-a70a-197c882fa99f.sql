-- Add missing RLS policies for remaining tables

-- Policies for classes table
CREATE POLICY "Students can view enrolled classes" ON public.classes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      JOIN public.profiles p ON e.student_id = p.id
      WHERE p.user_id = auth.uid() AND e.class_id = classes.id
    )
  );

CREATE POLICY "Teachers can view their classes" ON public.classes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() AND p.id = classes.teacher_id
    )
  );

CREATE POLICY "HODs can manage department classes" ON public.classes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      JOIN public.courses c ON classes.course_id = c.id
      WHERE p.user_id = auth.uid() 
      AND p.role IN ('hod', 'admin')
      AND (p.department = c.department OR p.role = 'admin')
    )
  );

-- Policies for enrollments table
CREATE POLICY "Students can view their enrollments" ON public.enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() AND p.id = enrollments.student_id
    )
  );

CREATE POLICY "Teachers can view class enrollments" ON public.enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      JOIN public.profiles p ON c.teacher_id = p.id
      WHERE p.user_id = auth.uid() AND c.id = enrollments.class_id
    )
  );

-- Policies for attendance_sessions table
CREATE POLICY "Students can view sessions for enrolled classes" ON public.attendance_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      JOIN public.profiles p ON e.student_id = p.id
      WHERE p.user_id = auth.uid() AND e.class_id = attendance_sessions.class_id
    )
  );

CREATE POLICY "Teachers can manage their sessions" ON public.attendance_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() AND p.id = attendance_sessions.teacher_id
    )
  );

-- Policies for quizzes table
CREATE POLICY "Students can view published quizzes for enrolled courses" ON public.quizzes
  FOR SELECT USING (
    is_published = true AND EXISTS (
      SELECT 1 FROM public.enrollments e
      JOIN public.classes c ON e.class_id = c.id
      JOIN public.profiles p ON e.student_id = p.id
      WHERE p.user_id = auth.uid() AND c.course_id = quizzes.course_id
    )
  );

CREATE POLICY "Teachers can manage their quizzes" ON public.quizzes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() AND p.id = quizzes.teacher_id
    )
  );

-- Policies for timetable table
CREATE POLICY "Students can view timetable for enrolled classes" ON public.timetable
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      JOIN public.profiles p ON e.student_id = p.id
      WHERE p.user_id = auth.uid() AND e.class_id = timetable.class_id
    )
  );

CREATE POLICY "Teachers can view timetable for their classes" ON public.timetable
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      JOIN public.profiles p ON c.teacher_id = p.id
      WHERE p.user_id = auth.uid() AND c.id = timetable.class_id
    )
  );

CREATE POLICY "HODs can manage department timetables" ON public.timetable
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      JOIN public.courses co ON c.course_id = co.id
      JOIN public.profiles p ON p.user_id = auth.uid()
      WHERE c.id = timetable.class_id
      AND p.role IN ('hod', 'admin')
      AND (p.department = co.department OR p.role = 'admin')
    )
  );

-- Policies for face_recognition_data table
CREATE POLICY "Students can view their own face data" ON public.face_recognition_data
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() AND p.id = face_recognition_data.student_id
    )
  );

CREATE POLICY "Teachers can manage face data for their students" ON public.face_recognition_data
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      JOIN public.classes c ON e.class_id = c.id
      JOIN public.profiles t ON c.teacher_id = t.id
      WHERE t.user_id = auth.uid() AND e.student_id = face_recognition_data.student_id
    )
  );