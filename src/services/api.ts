import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');

const TOKEN_KEY = 'datagate_token';

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(cb: () => void) {
  onUnauthorized = cb;
}

export async function loadToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      authToken = localStorage.getItem(TOKEN_KEY);
    } else {
      const SecureStore = await import('expo-secure-store');
      authToken = await SecureStore.getItemAsync(TOKEN_KEY);
    }
  } catch {
    authToken = null;
  }
  return authToken;
}

export async function saveToken(token: string) {
  authToken = token;
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      const SecureStore = await import('expo-secure-store');
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
  } catch {}
}

export async function clearToken() {
  authToken = null;
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(TOKEN_KEY);
    } else {
      const SecureStore = await import('expo-secure-store');
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch {}
}

export function getToken() {
  return authToken;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!BASE_URL) {
    throw new Error('Server URL konfiqurasiya olunmayıb');
  }
  const url = new URL(path, BASE_URL + '/').toString();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
      body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined,
    });
  } catch (networkErr: any) {
    console.error('[API] Network error:', networkErr?.message, 'URL:', url);
    throw new Error('Serverə qoşulmaq mümkün olmadı. İnternet bağlantınızı yoxlayın.');
  }

  if (res.status === 401) {
    await clearToken();
    onUnauthorized?.();
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.message ?? `Request failed with status ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  signup: (data: { email: string; password: string; name: string; phone?: string }) =>
    request<{ token: string; user: any }>('/api/signup', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: any }>('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  getMe: () => request<{ user: any }>('/api/auth/me'),

  deleteAccount: () => request<{ success: boolean }>('/api/auth/account', { method: 'DELETE' }),
  forgotPassword: (email: string) => request<{ success: boolean; message: string; smtpError?: boolean; smtpNotConfigured?: boolean }>('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token: string, newPassword: string) => request<{ success: boolean; message: string }>('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) }),

  // Student Dashboard
  getDashboard: (lang?: string) =>
    request<any>(`/api/student/dashboard${lang ? `?lang=${lang}` : ''}`),

  // Student Courses
  getCourses: () => request<{ courses: any[] }>('/api/student/courses'),
  getCourseDetail: (id: string) => request<{ course: any }>(`/api/student/courses/${id}`),
  getMaterialUrl: (id: string) => request<{ url: string; fileName: string; fileType: string }>(`/api/student/materials/${id}/url`),

  // Videos
  getVideo: (id: string) => request<{ video: any }>(`/api/student/videos/${id}`),
  markVideoWatched: (id: string) =>
    request<{ success: boolean }>(`/api/student/videos/${id}/progress`, { method: 'POST' }),

  // Student Exams
  getExams: (status?: string) =>
    request<{ exams: any[] }>(`/api/student/exams${status ? `?status=${status}` : ''}`),
  getExamDetail: (id: string) => request<{ exam: any }>(`/api/student/exams/${id}`),
  registerForExam: (id: string) =>
    request<any>(`/api/student/exams/${id}/register`, { method: 'POST' }),
  getExamSession: (id: string) => request<{ session: any }>(`/api/student/exams/${id}/session`),
  saveExamSession: (id: string, data: { answers: Record<string, string>; currentIdx: number }) =>
    request<any>(`/api/student/exams/${id}/session`, { method: 'PATCH', body: JSON.stringify(data) }),
  submitExam: (id: string) =>
    request<{ result: any }>(`/api/student/exams/${id}/submit`, { method: 'POST' }),
  getExamResult: (id: string) => request<{ result: any }>(`/api/student/exams/${id}/result`),
  getExamReview: (id: string) => request<{ review: any }>(`/api/student/exams/${id}/review`),
  getCertificate: (id: string) => request<{ certificate: any }>(`/api/student/exams/${id}/certificate`),

  // Notifications
  getNotifications: (page = 1, limit = 20, lang?: string) =>
    request<any>(`/api/student/notifications?page=${page}&limit=${limit}${lang ? `&lang=${lang}` : ''}`),
  markNotificationRead: (id: string) =>
    request<any>(`/api/student/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () =>
    request<any>('/api/student/notifications/read-all', { method: 'POST' }),

  // Student Profile
  getProfile: () => request<{ profile: any }>('/api/student/profile'),
  updateProfile: (data: any) =>
    request<{ profile: any }>('/api/student/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<{ success: boolean }>('/api/student/change-password', { method: 'POST', body: JSON.stringify(data) }),

  // ===== PUBLIC APIs (Udemy-style) =====
  publicGetCourses: () => request<{ courses: any[] }>('/api/public/courses'),
  publicGetCourseDetail: (id: string) => request<{ course: any }>(`/api/public/courses/${id}`),
  publicGetBlogs: (page = 1, limit = 10, category?: string) =>
    request<any>(`/api/public/blogs?page=${page}&limit=${limit}${category ? `&category=${category}` : ''}`),
  publicGetBlogBySlug: (slug: string) => request<{ post: any }>(`/api/public/blogs/${slug}`),
  publicGetTeachers: () => request<{ teachers: any[] }>('/api/public/teachers'),
  publicGetTeacherProfile: (id: string) => request<{ teacher: any }>(`/api/public/teachers/${id}`),
  publicGetSuccessStories: () => request<{ stories: any[] }>('/api/public/success-stories'),
  publicGetExams: () => request<{ exams: any[] }>('/api/public/exams'),

  // ===== TEACHER APIs =====
  teacherGetDashboard: () => request<any>('/api/teacher/dashboard'),
  teacherGetCourses: () => request<{ courses: any[] }>('/api/teacher/courses'),
  teacherGetCourseDetail: (id: string) => request<{ course: any }>(`/api/teacher/courses/${id}`),
  teacherGetGroups: () => request<{ groups: any[] }>('/api/teacher/groups'),
  teacherGetGroupStudents: (groupId: string) => request<any>(`/api/teacher/groups/${groupId}/students`),
  teacherRecordAttendance: (data: { groupId: string; date: string; records: { studentId: string; status: string; note?: string }[] }) =>
    request<any>('/api/teacher/attendance', { method: 'POST', body: JSON.stringify(data) }),
  teacherGetAttendanceHistory: (groupId: string, date?: string) =>
    request<any>(`/api/teacher/attendance/${groupId}${date ? `?date=${date}` : ''}`),
  teacherGetExams: () => request<{ exams: any[] }>('/api/teacher/exams'),
  teacherGetExamResults: (examId: string) => request<any>(`/api/teacher/exams/${examId}/results`),
  teacherGetStudentExamReview: (examId: string, studentId: string) => request<{ review: any }>(`/api/teacher/exams/${examId}/results/${studentId}/review`),
  teacherGiveFeedback: (data: { studentId: string; comment: string; rating?: number; category?: string }) =>
    request<any>('/api/teacher/feedback', { method: 'POST', body: JSON.stringify(data) }),
  teacherGetProfile: () => request<{ profile: any }>('/api/teacher/profile'),
  teacherUpdateProfile: (data: any) =>
    request<{ profile: any }>('/api/teacher/profile', { method: 'PATCH', body: JSON.stringify(data) }),

  // ===== PARENT APIs =====
  parentGetDashboard: () => request<any>('/api/parent/dashboard'),
  parentGetChildren: () => request<{ children: any[] }>('/api/parent/children'),
  parentGetChildDetail: (childId: string) => request<any>(`/api/parent/children/${childId}`),
  parentGetChildAttendance: (childId: string, courseId?: string, month?: string) => {
    const params = new URLSearchParams();
    if (courseId) params.append('courseId', courseId);
    if (month) params.append('month', month);
    const qs = params.toString();
    return request<any>(`/api/parent/children/${childId}/attendance${qs ? `?${qs}` : ''}`);
  },
  parentGetChildGrades: (childId: string) => request<any>(`/api/parent/children/${childId}/grades`),
  parentGetChildExamReview: (childId: string, examId: string) => request<{ review: any }>(`/api/parent/children/${childId}/exams/${examId}/review`),
  parentGetChildFeedback: (childId: string) => request<any>(`/api/parent/children/${childId}/feedback`),
  parentGetProfile: () => request<{ profile: any }>('/api/parent/profile'),

  // ===== STUDENT STUDY GROUPS =====
  getStudyGroups: (category?: string, lang?: string) =>
    request<any>(`/api/student/study-groups?${category ? `category=${category}&` : ''}${lang ? `lang=${lang}` : ''}`),
  getStudyGroupDetail: (groupId: string, lang?: string) =>
    request<any>(`/api/student/study-groups/${groupId}${lang ? `?lang=${lang}` : ''}`),
  getStudyGroupQuestions: (groupId: string, status?: string) =>
    request<any>(`/api/student/study-groups/${groupId}/questions${status ? `?status=${status}` : ''}`),
  answerStudyQuestion: (groupId: string, questionId: string, selectedIndex: number) =>
    request<any>(`/api/student/study-groups/${groupId}/questions/${questionId}/answer`, { method: 'POST', body: JSON.stringify({ selectedIndex }) }),
  addStudyComment: (groupId: string, questionId: string, content: string) =>
    request<any>(`/api/student/study-groups/${groupId}/questions/${questionId}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),
  getStudyLeaderboard: (groupId: string, period?: string) =>
    request<any>(`/api/student/study-groups/${groupId}/leaderboard${period ? `?period=${period}` : ''}`),
  getStudyBadges: (groupId: string, lang?: string) =>
    request<any>(`/api/student/study-groups/${groupId}/badges${lang ? `?lang=${lang}` : ''}`),
  getAttendance: (courseId?: string, month?: string) => {
    const params = new URLSearchParams();
    if (courseId) params.append('courseId', courseId);
    if (month) params.append('month', month);
    const qs = params.toString();
    return request<any>(`/api/student/attendance${qs ? `?${qs}` : ''}`);
  },

  // ===== TEACHER STUDY GROUPS (Moderator) =====
  teacherGetStudyGroups: () => request<any>('/api/teacher/study-groups'),
  teacherGetStudyGroupDetail: (groupId: string) => request<any>(`/api/teacher/study-groups/${groupId}`),
  teacherGetUploadUrl: (data: { fileName: string; contentType: string }) =>
    request<{ uploadUrl: string; publicUrl: string; cloud_storage_path: string }>('/api/teacher/upload-url', { method: 'POST', body: JSON.stringify(data) }),
  teacherPostStudyQuestion: (groupId: string, data: { questionText: string; options?: string[]; correctIndex?: number; difficulty?: string; timeLimit?: number; imageUrl?: string }) =>
    request<any>(`/api/teacher/study-groups/${groupId}/questions`, { method: 'POST', body: JSON.stringify(data) }),
  teacherCloseStudyQuestion: (groupId: string, questionId: string) =>
    request<any>(`/api/teacher/study-groups/${groupId}/questions/${questionId}/close`, { method: 'PATCH' }),
  teacherGetStudentDetail: (groupId: string, studentId: string) =>
    request<any>(`/api/teacher/groups/${groupId}/students/${studentId}`),
  teacherGetStudentAttendance: (groupId: string, studentId: string, month?: string) => {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    const qs = params.toString();
    return request<any>(`/api/teacher/groups/${groupId}/students/${studentId}/attendance${qs ? `?${qs}` : ''}`);
  },

  // ===== ADMIN APIs =====
  adminGetDashboard: () => request<any>('/api/admin/dashboard'),
  adminGetUsers: (role?: string, page = 1, limit = 20, search?: string, groupId?: string, courseId?: string) => {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));
    if (role) params.append('role', role);
    if (search) params.append('search', search);
    if (groupId) params.append('groupId', groupId);
    if (courseId) params.append('courseId', courseId);
    return request<any>(`/api/admin/users?${params.toString()}`);
  },
  adminGetUserDetail: (userId: string) => request<any>(`/api/admin/users/${userId}`),
  adminToggleUserStatus: (userId: string, isActive: boolean) =>
    request<any>(`/api/admin/users/${userId}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),
  adminGetCourses: () => request<any>('/api/admin/courses'),
  adminGetGroups: () => request<any>('/api/admin/groups'),
  adminGetProfile: () => request<{ profile: any }>('/api/admin/profile'),

  // Finance
  adminGetFinanceSummary: (month?: number, year?: number) => {
    const params = new URLSearchParams();
    if (month !== undefined) params.append('month', String(month));
    if (year !== undefined) params.append('year', String(year));
    return request<any>(`/api/admin/finance/summary?${params.toString()}`);
  },
  adminGetIncomeList: (month?: number, year?: number) => {
    const params = new URLSearchParams();
    if (month !== undefined) params.append('month', String(month));
    if (year !== undefined) params.append('year', String(year));
    return request<any>(`/api/admin/finance/income?${params.toString()}`);
  },
  adminCreateIncome: (data: { title: string; description?: string; amount: number; category: string; date?: string }) =>
    request<any>('/api/admin/finance/income', { method: 'POST', body: JSON.stringify(data) }),
  adminUpdateIncome: (id: string, data: any) =>
    request<any>(`/api/admin/finance/income/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  adminDeleteIncome: (id: string) =>
    request<any>(`/api/admin/finance/income/${id}`, { method: 'DELETE' }),
  adminGetExpenseList: (month?: number, year?: number) => {
    const params = new URLSearchParams();
    if (month !== undefined) params.append('month', String(month));
    if (year !== undefined) params.append('year', String(year));
    return request<any>(`/api/admin/finance/expenses?${params.toString()}`);
  },
  adminCreateExpense: (data: { title: string; description?: string; amount: number; category: string; date?: string }) =>
    request<any>('/api/admin/finance/expenses', { method: 'POST', body: JSON.stringify(data) }),
  adminUpdateExpense: (id: string, data: any) =>
    request<any>(`/api/admin/finance/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  adminDeleteExpense: (id: string) =>
    request<any>(`/api/admin/finance/expenses/${id}`, { method: 'DELETE' }),
  adminGetTemplates: (type?: string) =>
    request<any>(`/api/admin/finance/templates${type ? `?type=${type}` : ''}`),
  adminCreateTemplate: (data: { title: string; description?: string; amount: number; category: string; type: string }) =>
    request<any>('/api/admin/finance/templates', { method: 'POST', body: JSON.stringify(data) }),
  adminUpdateTemplate: (id: string, data: any) =>
    request<any>(`/api/admin/finance/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  adminDeleteTemplate: (id: string) =>
    request<any>(`/api/admin/finance/templates/${id}`, { method: 'DELETE' }),
  adminApplyTemplate: (id: string, date?: string) =>
    request<any>(`/api/admin/finance/templates/${id}/apply`, { method: 'POST', body: JSON.stringify({ date }) }),

  // ===== QR ATTENDANCE =====
  teacherCreateAttendanceSession: (data: { groupId: string; durationMinutes?: number }) =>
    request<any>('/api/teacher/attendance/session', { method: 'POST', body: JSON.stringify(data) }),
  teacherGetActiveSession: (groupId: string) =>
    request<any>(`/api/teacher/attendance/session/${groupId}`),
  teacherCloseSession: (sessionId: string) =>
    request<any>(`/api/teacher/attendance/session/${sessionId}/close`, { method: 'PATCH' }),
  teacherGetSessionResults: (sessionId: string) =>
    request<any>(`/api/teacher/attendance/session/${sessionId}/results`),
  studentAttendanceCheckin: (data: { qrCode?: string; pinCode?: string }) =>
    request<any>('/api/student/attendance/checkin', { method: 'POST', body: JSON.stringify(data) }),

  // ===== NOTIFICATIONS (role-based) =====
  studentRespondToSurvey: (questionId: string, answer: string) =>
    request<any>('/api/student/notifications/survey/respond', { method: 'POST', body: JSON.stringify({ questionId, answer }) }),
  studentRsvpEvent: (eventId: string, attending: boolean) =>
    request<any>('/api/student/notifications/event/rsvp', { method: 'POST', body: JSON.stringify({ eventId, attending }) }),

  parentGetNotifications: (page = 1, limit = 20) =>
    request<any>(`/api/parent/notifications?page=${page}&limit=${limit}`),
  parentMarkNotificationRead: (id: string) =>
    request<any>(`/api/parent/notifications/${id}/read`, { method: 'PATCH' }),
  parentMarkAllNotificationsRead: () =>
    request<any>('/api/parent/notifications/read-all', { method: 'POST' }),
  parentRespondToSurvey: (questionId: string, answer: string) =>
    request<any>('/api/parent/notifications/survey/respond', { method: 'POST', body: JSON.stringify({ questionId, answer }) }),
  parentRsvpEvent: (eventId: string, attending: boolean) =>
    request<any>('/api/parent/notifications/event/rsvp', { method: 'POST', body: JSON.stringify({ eventId, attending }) }),

  teacherGetNotifications: (page = 1, limit = 20) =>
    request<any>(`/api/teacher/notifications?page=${page}&limit=${limit}`),
  teacherMarkNotificationRead: (id: string) =>
    request<any>(`/api/teacher/notifications/${id}/read`, { method: 'PATCH' }),
  teacherMarkAllNotificationsRead: () =>
    request<any>('/api/teacher/notifications/read-all', { method: 'POST' }),
  teacherRespondToSurvey: (questionId: string, answer: string) =>
    request<any>('/api/teacher/notifications/survey/respond', { method: 'POST', body: JSON.stringify({ questionId, answer }) }),
  teacherRsvpEvent: (eventId: string, attending: boolean) =>
    request<any>('/api/teacher/notifications/event/rsvp', { method: 'POST', body: JSON.stringify({ eventId, attending }) }),

  // ===== ADMIN NOTIFICATIONS =====
  adminGetNotifications: (page = 1, limit = 20) =>
    request<any>(`/api/admin/notifications?page=${page}&limit=${limit}`),
  adminGetNotificationDetail: (id: string) =>
    request<any>(`/api/admin/notifications/${id}`),
  adminGetNotificationAudiences: () =>
    request<any>('/api/admin/notifications/audiences'),
  adminCreateNotification: (data: any) =>
    request<any>('/api/admin/notifications', { method: 'POST', body: JSON.stringify(data) }),
  adminSendNotification: (id: string) =>
    request<any>(`/api/admin/notifications/${id}/send`, { method: 'POST' }),
  adminCancelNotification: (id: string) =>
    request<any>(`/api/admin/notifications/${id}/cancel`, { method: 'POST' }),
  adminGetNotificationUploadUrl: (fileName: string, contentType: string) =>
    request<any>('/api/admin/notifications/upload-url', { method: 'POST', body: JSON.stringify({ fileName, contentType }) }),
};
