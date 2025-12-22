import React from 'react';

// Pages
import Help from '~/pages/Help/Help';
import Group from '~/pages/Group/Group';
import MyTask from '~/pages/MyTask/MyTask';
import Setting from '~/pages/Setting/Setting';
import { Login, Register } from '~/pages/Auth';
import Calendar from '~/pages/Calendar/Calendar';
import Dashboard from '~/pages/Dashboard/Dashboard';
import TaskCategories from '~/pages/TaskCategories/TaskCategories';
import CategoryDetail from '~/pages/TaskCategories/CategoryDetail';

// Admin Pages
import AdminDashboard from '~/pages/Admin/Dashboard/Dashboard';
import UserManagement from '~/pages/Admin/UserManagement/UserManagement';
import TaskManagement from '~/pages/Admin/TaskManagement/TaskManagement';

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
];

// 3. ADMIN ROUTES (Dảnh riêng cho Admin)
const adminRoutes: RouteType[] = [
  {
    path: '/admin',
    component: AdminDashboard,
    layout: AdminLayout,
  },
  {
    path: '/admin/settings',
    component: Setting, // Tái sử dụng component Setting của User
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
];

export { publicRoutes, privateRoutes, adminRoutes };
