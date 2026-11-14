import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom';
import { TabBar } from './TabBar';
import { ProjectsScreen } from '../features/projects/ProjectsScreen';

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
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Placeholder title="Inicio" />} />
          <Route path="proyectos" element={<ProjectsScreen />} />
          <Route path="calendario" element={<Placeholder title="Calendario" />} />
          <Route path="perfil" element={<Placeholder title="Perfil" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
