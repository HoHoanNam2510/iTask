import React from 'react';

// Pages
import Cart from '~/pages/Cart';
import Help from '~/pages/Help/Help';
import Group from '~/pages/Group/Group';
import MyTask from '~/pages/MyTask/MyTask';
import { Login, Register } from '~/pages/Auth';
import Calendar from '~/pages/Calendar/Calendar';
import Dashboard from '~/pages/Dashboard/Dashboard';
import TaskCategories from '~/pages/TaskCategories/TaskCategories';

// Layouts
import AuthLayout from '~/layouts/AuthLayout';
import DefaultLayout from '~/layouts/DefaultLayout';

// Giả định bạn sẽ tạo trang này để xem chi tiết 1 nhóm
// Nếu chưa có, bạn có thể tạo file rỗng để không bị lỗi import
// import GroupDetail from '~/pages/Group/GroupDetail';

// Tạm thời dùng Dashboard làm placeholder cho GroupDetail để code không lỗi
// const GroupDetail = Dashboard;

type RouteType = {
  path: string;
  component: React.FC;
  layout?: React.FC<{ children: React.ReactNode }> | null;
};

// 1. PUBLIC ROUTES
const publicRoutes: RouteType[] = [
  { path: '/login', component: Login, layout: AuthLayout },
  { path: '/register', component: Register, layout: AuthLayout },
  { path: '/cart', component: Cart, layout: DefaultLayout },
];

// 2. PRIVATE ROUTES
const privateRoutes: RouteType[] = [
  { path: '/', component: Dashboard, layout: DefaultLayout },
  { path: '/help', component: Help, layout: DefaultLayout },
  { path: '/calendar', component: Calendar, layout: DefaultLayout },
  { path: '/my-task', component: MyTask, layout: DefaultLayout },
  {
    path: '/task-categories',
    component: TaskCategories,
    layout: DefaultLayout,
  },
  { path: '/groups/:groupId', component: Group, layout: DefaultLayout },
];

export { publicRoutes, privateRoutes };
