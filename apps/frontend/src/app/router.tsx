import { createBrowserRouter } from "react-router";

import { RootLayout } from "@/layouts/RootLayout";
import { HomePage } from "@/pages/HomePage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { RepositoriesPage } from "@/pages/RepositoriesPage";
import { RepositoryPage } from "@/pages/RepositoryPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "repositories",
        element: <RepositoriesPage />,
      },
      {
        path: "repositories/:owner/:name",
        element: <RepositoryPage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);
