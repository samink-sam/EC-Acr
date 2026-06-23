import { createBrowserRouter } from "react-router-dom";
import { RoleGuard } from "@/app/RoleGuard";
import { RootLayout } from "@/app/RootLayout";
import {
  AboutPage,
  ApplicantDashboard,
  ApplicantProfilePage,
  ApplicationReviewDetailPage,
  ApplicationFormPage,
  AuditPage,
  CardPage,
  LoginPage,
  LoginHubPage,
  MasterDataPage,
  NotFoundPage,
  NotificationsPage,
  PublicHome,
  ReportsPage,
  ReviewQueuePage,
  SuperAdminApplicationsPage,
  SuperAdminCardsPage,
  SuperAdminDashboardPage,
  SuperAdminSettingsPage,
  SuperAdminUsersPage,
  VerifyPage,
} from "@/pages/PortalPages";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/", element: <PublicHome /> },
      { path: "/login", element: <LoginHubPage /> },
      { path: "/login/:roleSlug", element: <LoginPage /> },
      { path: "/verify", element: <VerifyPage /> },
      { path: "/cards/:cardNumber", element: <CardPage /> },
      { path: "/about", element: <AboutPage /> },
      {
        element: <RoleGuard allow={["applicant"]} />,
        children: [
          { path: "/applicant", element: <ApplicantDashboard /> },
          { path: "/applicant/apply", element: <ApplicationFormPage /> },
          { path: "/applicant/profile", element: <ApplicantProfilePage /> },
        ],
      },
      {
        element: (
          <RoleGuard
            allow={["central_admin", "returning_officer", "super_admin"]}
          />
        ),
        children: [
          { path: "/admin/review", element: <ReviewQueuePage /> },
          {
            path: "/admin/review/:applicationId",
            element: <ApplicationReviewDetailPage />,
          },
          { path: "/reports", element: <ReportsPage /> },
          { path: "/notifications", element: <NotificationsPage /> },
        ],
      },
      {
        element: <RoleGuard allow={["super_admin"]} />,
        children: [
          {
            path: "/superadmin/dashboard",
            element: <SuperAdminDashboardPage />,
          },
          { path: "/superadmin/users", element: <SuperAdminUsersPage /> },
          { path: "/superadmin/master-data", element: <MasterDataPage /> },
          { path: "/superadmin/settings", element: <SuperAdminSettingsPage /> },
          {
            path: "/superadmin/applications",
            element: <SuperAdminApplicationsPage />,
          },
          {
            path: "/superadmin/applications/:applicationId",
            element: <ApplicationReviewDetailPage />,
          },
          { path: "/superadmin/cards", element: <SuperAdminCardsPage /> },
          { path: "/superadmin/audit", element: <AuditPage /> },
          { path: "/superadmin/notifications", element: <NotificationsPage /> },
          {
            path: "/super-admin/dashboard",
            element: <SuperAdminDashboardPage />,
          },
          { path: "/super-admin/master-data", element: <MasterDataPage /> },
          { path: "/super-admin/audit", element: <AuditPage /> },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
