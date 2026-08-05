import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Seo } from "./components/Seo";
import { Home } from "./routes/Home";
import { LessonPage } from "./routes/LessonPage";
import { MethodPage } from "./routes/MethodPage";
import { ProfessionalEnglishHome } from "./routes/ProfessionalEnglishHome";
import { ProfessionalEnglishLessonPage } from "./routes/ProfessionalEnglishLessonPage";
import { TestPage } from "./routes/TestPage";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Seo />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lesson/:id" element={<LessonPage />} />
        <Route path="/method" element={<MethodPage />} />
        <Route path="/professional-english" element={<ProfessionalEnglishHome />} />
        <Route
          path="/professional-english/:id"
          element={<ProfessionalEnglishLessonPage />}
        />
        <Route path="/test" element={<TestPage />} />
      </Routes>
      <Analytics />
    </BrowserRouter>
  </StrictMode>,
);
