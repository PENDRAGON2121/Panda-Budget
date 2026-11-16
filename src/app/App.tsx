import { MotionConfig } from 'motion/react';
import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom';
import { TabBar } from './TabBar';
import { ProjectsScreen } from '../features/projects/ProjectsScreen';
import { ProjectDetail } from '../features/projects/ProjectDetail';
import { ExpenseDetail } from '../features/expenses/ExpenseDetail';
import { HomeScreen } from '../features/home/HomeScreen';
import { CalendarScreen } from '../features/calendar/CalendarScreen';

function Layout() {
  return (
    <div className="mx-auto min-h-screen max-w-md px-[18px] pb-24 pt-6">
      <main>
        <Outlet />
      </main>
      <TabBar />
    </div>
  );
}

const Placeholder = ({ title }: { title: string }) => (
  <h1 className="font-display text-[17px] font-black">{title}</h1>
);

export function App() {
  return (
    <MotionConfig reducedMotion="user">
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomeScreen />} />
          <Route path="proyectos" element={<ProjectsScreen />} />
          <Route path="proyectos/:id" element={<ProjectDetail />} />
          <Route path="gastos/:id" element={<ExpenseDetail />} />
          <Route path="calendario" element={<CalendarScreen />} />
          <Route path="perfil" element={<Placeholder title="Perfil" />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </MotionConfig>
  );
}
