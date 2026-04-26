import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Layout from "@/components/Layout";
import HomePage from "@/pages/HomePage";
import LocationDetailPage from "@/pages/LocationDetailPage";

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" />
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/location/:id" element={<LocationDetailPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
