import { Navigate, Route, Routes } from "react-router-dom"
import { ApplyPage, JobDetailPage } from "@/pages/apply"
import { CulturePage } from "@/pages/culture"
import { MembersPage } from "@/pages/members"
import { NotFoundPage } from "@/pages/not-found"
import { ServicePage } from "@/pages/service"

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/service" replace />} />
      <Route path="/service" element={<ServicePage />} />
      <Route path="/culture" element={<CulturePage />} />
      <Route path="/apply" element={<ApplyPage />} />
      <Route path="/apply/:jobId" element={<JobDetailPage />} />
      <Route path="/members" element={<MembersPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
