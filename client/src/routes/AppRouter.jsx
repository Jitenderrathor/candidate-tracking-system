import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthLayout } from '@/layout/AuthLayout';
import { DashboardLayout } from '@/layout/DashboardLayout';
import { PublicLayout } from '@/layout/PublicLayout';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { LoginPage } from '@/pages/LoginPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ChangePasswordPage } from '@/pages/ChangePasswordPage';
import { LoadingPage } from '@/pages/LoadingPage';
import { ROLES } from '@/constants/auth';
import { ROUTES } from '@/constants/routes';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { PublicRoute } from '@/routes/PublicRoute';

const PublicDashboardPage = lazy(() =>
  import('@/pages/PublicDashboardPage').then((module) => ({ default: module.PublicDashboardPage })),
);
const InternalDashboardPage = lazy(() =>
  import('@/pages/InternalDashboardPage').then((module) => ({
    default: module.InternalDashboardPage,
  })),
);
const CandidateListPage = lazy(() =>
  import('@/pages/CandidateListPage').then((module) => ({ default: module.CandidateListPage })),
);
const CandidateDetailsPage = lazy(() =>
  import('@/pages/CandidateDetailsPage').then((module) => ({
    default: module.CandidateDetailsPage,
  })),
);
const UserListPage = lazy(() =>
  import('@/pages/UserListPage').then((module) => ({ default: module.UserListPage })),
);
const ExcelImportPage = lazy(() =>
  import('@/pages/ExcelImportPage').then((module) => ({ default: module.ExcelImportPage })),
);
const ReportsPage = lazy(() =>
  import('@/pages/ReportsPage').then((module) => ({ default: module.ReportsPage })),
);
const TrashPage = lazy(() =>
  import('@/pages/TrashPage').then((module) => ({ default: module.TrashPage })),
);

export function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route
          element={
            <Suspense fallback={<LoadingPage />}>
              <PublicDashboardPage />
            </Suspense>
          }
          path={ROUTES.HOME}
        />
        <Route
          element={
            <Suspense fallback={<LoadingPage />}>
              <PublicDashboardPage />
            </Suspense>
          }
          path={ROUTES.PUBLIC_DASHBOARD}
        />
        <Route element={<NotFoundPage />} path={ROUTES.NOT_FOUND} />
      </Route>

      <Route element={<PublicRoute />}>
        <Route element={<AuthLayout />}>
          <Route element={<LoginPage />} path={ROUTES.LOGIN} />
          <Route element={<ForgotPasswordPage />} path={ROUTES.FORGOT_PASSWORD} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route element={<ChangePasswordPage />} path={ROUTES.CHANGE_PASSWORD} />
          <Route
            element={
              <Suspense fallback={<LoadingPage />}>
                <InternalDashboardPage />
              </Suspense>
            }
            path={ROUTES.DASHBOARD}
          />
          <Route
            element={
              <Suspense fallback={<LoadingPage />}>
                <CandidateListPage />
              </Suspense>
            }
            path={ROUTES.CANDIDATES}
          />
          <Route
            element={
              <Suspense fallback={<LoadingPage />}>
                <CandidateDetailsPage />
              </Suspense>
            }
            path={ROUTES.CANDIDATE_DETAILS}
          />
          <Route
            element={
              <Suspense fallback={<LoadingPage />}>
                <ReportsPage />
              </Suspense>
            }
            path={ROUTES.REPORTS}
          />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>
        <Route element={<DashboardLayout />}>
          <Route
            element={
              <Suspense fallback={<LoadingPage />}>
                <UserListPage />
              </Suspense>
            }
            path={ROUTES.USERS}
          />
          <Route
            element={
              <Suspense fallback={<LoadingPage />}>
                <ExcelImportPage />
              </Suspense>
            }
            path={ROUTES.EXCEL_IMPORT}
          />
          <Route
            element={
              <Suspense fallback={<LoadingPage />}>
                <TrashPage />
              </Suspense>
            }
            path={ROUTES.TRASH}
          />
        </Route>
      </Route>

      <Route element={<Navigate replace to={ROUTES.NOT_FOUND} />} path="*" />
    </Routes>
  );
}
