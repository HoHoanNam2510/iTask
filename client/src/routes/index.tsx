import React from 'react';

// Pages
import Help from '~/pages/Help/Help';
import Trash from '~/pages/Trash/Trash';
import Group from '~/pages/Group/Group';
import MyTask from '~/pages/MyTask/MyTask';
import Setting from '~/pages/Setting/Setting';
import Calendar from '~/pages/Calendar/Calendar';
import Dashboard from '~/pages/Dashboard/Dashboard';
import TaskCategories from '~/pages/TaskCategories/TaskCategories';
import CategoryDetail from '~/pages/TaskCategories/CategoryDetail';
import { Login, Register, ForgotPassword, ResetPassword } from '~/pages/Auth';

// Admin Pages
import AdminDashboard from '~/pages/Admin/Dashboard/Dashboard';
import UserManagement from '~/pages/Admin/UserManagement/UserManagement';
import TaskManagement from '~/pages/Admin/TaskManagement/TaskManagement';
import GroupManagement from '~/pages/Admin/GroupManagement/GroupManagement';
import CategoryManagement from '~/pages/Admin/CategoryManagement/CategoryManagement';
import FeedbackManagement from '~/pages/Admin/FeedbackManagement/FeedbackManagement';

// Layouts
import AuthLayout from '~/layouts/AuthLayout';
import DefaultLayout from '~/layouts/DefaultLayout';
import AdminLayout from '~/layouts/AdminLayout/AdminLayout';

type RouteType = {
  path: string;
  component: React.FC;
  layout?: React.FC<{ children: React.ReactNode }> | null;
};

// 1. PUBLIC ROUTES (Ai cũng xem được)
const publicRoutes: RouteType[] = [
  { path: '/login', component: Login, layout: AuthLayout },
  { path: '/register', component: Register, layout: AuthLayout },
  { path: '/forgot-password', component: ForgotPassword, layout: AuthLayout },
  {
    path: '/reset-password/:token',
    component: ResetPassword,
    layout: AuthLayout,
  },
  { path: '/', component: Dashboard, layout: DefaultLayout },
];

// 2. PRIVATE ROUTES (Chưa login sẽ bị đá về trang Login)
const privateRoutes: RouteType[] = [
  { path: '/help', component: Help, layout: DefaultLayout },
  { path: '/calendar', component: Calendar, layout: DefaultLayout },
  { path: '/my-task', component: MyTask, layout: DefaultLayout },
  {
    path: '/task-categories',
    component: TaskCategories,
    layout: DefaultLayout,
  },
  {
    path: '/task-categories/:id',
    component: CategoryDetail,
    layout: DefaultLayout,
  },
  { path: '/settings', component: Setting, layout: DefaultLayout },
  { path: '/groups/:groupId', component: Group, layout: DefaultLayout },
  { path: '/trash', component: Trash }, // Route Trash của User
];

// 3. ADMIN ROUTES (Dành riêng cho Admin)
const adminRoutes: RouteType[] = [
  {
    path: '/admin',
    component: AdminDashboard,
    layout: AdminLayout,
  },
  {
    path: '/admin/settings',
    // Tái sử dụng component Setting của User
    component: Setting,
    layout: AdminLayout,
  },
  {
    path: '/admin/users',
    component: UserManagement,
    layout: AdminLayout,
  },
  {
    path: '/admin/tasks',
    component: TaskManagement,
    layout: AdminLayout,
  },
  {
    path: '/admin/groups',
    component: GroupManagement,
    layout: AdminLayout,
  },
  {
    path: '/admin/categories',
    component: CategoryManagement,
    layout: AdminLayout,
  },
  {
    path: '/admin/feedbacks',
    component: FeedbackManagement,
    layout: AdminLayout,
  },
  {
    path: '/admin/trash',
    component: Trash,
    layout: AdminLayout,
  },
];

export { publicRoutes, privateRoutes, adminRoutes };
