import { MotionConfig } from 'motion/react';
import { BrowserRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { StorageGate } from './StorageGate';
import { TabBar } from './TabBar';
import { ProjectsScreen } from '../features/projects/ProjectsScreen';
import { ProjectDetail } from '../features/projects/ProjectDetail';
import { ExpenseDetail } from '../features/expenses/ExpenseDetail';
import { HomeScreen } from '../features/home/HomeScreen';
import { CalendarScreen } from '../features/calendar/CalendarScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { WelcomeScreen } from '../features/welcome/WelcomeScreen';
import { useUserName } from '../lib/useUserName';
import { NativeShell } from '../native/NativeShell';
import { UpdateManager } from '../features/updates/UpdateManager';

function RoutedShell() {
  return <NativeShell path={useLocation().pathname} />;
}

function Layout() {
  return (
    <div className="mx-auto min-h-screen max-w-md px-[18px] pb-32 pt-[calc(1.5rem+env(safe-area-inset-top))]">
      <main>
        <Outlet />
      </main>
      <TabBar />
    </div>
  );
}

function Routed() {
  const name = useUserName();
  if (!name) {
    return (
      <>
        <NativeShell path="/" />
        <WelcomeScreen />
      </>
    );
  }
  return (
    <BrowserRouter>
      <RoutedShell />
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
  );
}

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <StorageGate>
        <Routed />
      </StorageGate>
      <UpdateManager />
    </MotionConfig>
  );
}
