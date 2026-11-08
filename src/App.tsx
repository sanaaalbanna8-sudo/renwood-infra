import { createHashRouter, Navigate, RouterProvider } from 'react-router-dom';
import { useStore } from './context/Store';
import { GuideHome } from './pages/GuideHome';
import { GuideStage } from './pages/GuideStage';
import { Review } from './pages/Review';
import { Summary } from './pages/Summary';
import { Teacher } from './pages/Teacher';
import { Welcome } from './pages/Welcome';
import { Wizard } from './pages/Wizard';
import { Shell } from './components/Shell';

function NamedShell() {
  const { data } = useStore();
  if (data.name.trim().length < 2) return <Navigate to="/" replace />;
  return <Shell />;
}

const router = createHashRouter([
  { path: '/', element: <Welcome /> },
  { path: '/teacher', element: <Teacher /> },
  { path: '/summary', element: <Summary /> },
  {
    element: <NamedShell />,
    children: [
      { path: '/read', element: <Navigate to="/wizard/0/0" replace /> },
      { path: '/wizard/:stage/:index', element: <Wizard /> },
      { path: '/review', element: <Review /> },
      { path: '/guide', element: <GuideHome /> },
      { path: '/guide/:activity/:stage', element: <GuideStage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

export function App() {
  return (
    <>
      <RouterProvider router={router} />
      <p className="site-rights" lang="en" dir="ltr">
        © Sanaa Albanna. All rights reserved.
      </p>
    </>
  );
}
