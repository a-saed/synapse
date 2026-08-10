import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const queryClient = new QueryClient();

function ProjectsPlaceholder() {
  return <div>Projects</div>;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ProjectsPlaceholder />} />
          <Route path="/projects" element={<ProjectsPlaceholder />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
