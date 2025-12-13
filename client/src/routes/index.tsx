import React from 'react';

// Pages
import Help from '~/pages/Help/Help';
import Group from '~/pages/Group/Group';
import MyTask from '~/pages/MyTask/MyTask';
import { Login, Register } from '~/pages/Auth';
import Calendar from '~/pages/Calendar/Calendar';
import Dashboard from '~/pages/Dashboard/Dashboard';
import TaskCategories from '~/pages/TaskCategories/TaskCategories';
import CategoryDetail from '~/pages/TaskCategories/CategoryDetail';

// Layouts
import AuthLayout from '~/layouts/AuthLayout';
import DefaultLayout from '~/layouts/DefaultLayout';

type RouteType = {
  path: string;
  component: React.FC;
  layout?: React.FC<{ children: React.ReactNode }> | null;
};

// 1. PUBLIC ROUTES (Ai cũng xem được)
const publicRoutes: RouteType[] = [
  { path: '/login', component: Login, layout: AuthLayout },
  { path: '/register', component: Register, layout: AuthLayout },
  { path: '/', component: Dashboard, layout: DefaultLayout }, // <--- ĐÃ CHUYỂN DASHBOARD VỀ ĐÂY
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
  { path: '/groups/:groupId', component: Group, layout: DefaultLayout },
];

export { publicRoutes, privateRoutes };
