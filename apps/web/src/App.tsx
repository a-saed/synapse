import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { ProjectListPage } from "./pages/ProjectListPage";
import { WorkspacePage } from "./pages/WorkspacePage";

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster theme="dark" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ProjectListPage />} />
          <Route path="/projects" element={<ProjectListPage />} />
          <Route path="/projects/:id" element={<WorkspacePage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
