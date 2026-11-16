import { MotionConfig } from 'motion/react';
import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom';
import { StorageGate } from './StorageGate';
import { TabBar } from './TabBar';
import { ProjectsScreen } from '../features/projects/ProjectsScreen';
import { ProjectDetail } from '../features/projects/ProjectDetail';
import { ExpenseDetail } from '../features/expenses/ExpenseDetail';
import { HomeScreen } from '../features/home/HomeScreen';
import { CalendarScreen } from '../features/calendar/CalendarScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';

function Layout() {
  return (
    <div className="mx-auto min-h-screen max-w-md px-[18px] pb-32 pt-6">
      <main>
        <Outlet />
      </main>
      <TabBar />
    </div>
  );
}

export function App() {
  return (
    <MotionConfig reducedMotion="user">
    <StorageGate>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomeScreen />} />
          <Route path="proyectos" element={<ProjectsScreen />} />
          <Route path="proyectos/:id" element={<ProjectDetail />} />
          <Route path="gastos/:id" element={<ExpenseDetail />} />
          <Route path="calendario" element={<CalendarScreen />} />
          <Route path="perfil" element={<ProfileScreen />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </StorageGate>
    </MotionConfig>
  );
}
