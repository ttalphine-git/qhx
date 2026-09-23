import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import OfficeLogin from "./pages/office/OfficeLogin";
import OfficeDashboard from "./pages/office/OfficeDashboard";
import ApplicationsPage from "./pages/office/ApplicationsPage";
import ApplicationDetailPage from "./pages/office/ApplicationDetailPage";
import UsersPage from "./pages/office/UsersPage"
import CustomerManagementPage from "./pages/office/CustomerManagementPage"
import OfficeCustomerDetailPage from "./pages/office/OfficeCustomerDetailPage"
import OfficeSettingsPage from "./pages/office/OfficeSettingsPage";
import CustomerLogin from "./pages/customer/CustomerLogin";
import CustomerRegister from "./pages/customer/CustomerRegister";
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import CustomerApplicationsPage from "./pages/customer/CustomerApplicationsPage";
import CustomerCertificatesPage from "./pages/customer/CustomerCertificatesPage";
import CustomerApplyPage from "./pages/customer/CustomerApplyPage"
import CustomerFactoriesPage from "./pages/customer/CustomerFactoriesPage";
import CustomerProductsPage from "./pages/customer/CustomerProductsPage";
import CustomerProfilePage from "./pages/customer/CustomerProfilePage";
import AuditTrailPage from "./pages/office/AuditTrailPage";
import AuditsPage from "./pages/office/AuditsPage";
import CertificateDesignerPage from "./pages/office/CertificateDesignerPage";
import CertificateVerifyPage from "./pages/public/CertificateVerifyPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/office/login" replace />} />
        <Route path="/office/login" element={<OfficeLogin />} />
        <Route path="/office/dashboard" element={<OfficeDashboard />} />
        <Route path="/office/applications" element={<ApplicationsPage />} />
        <Route path="/office/applications/:id" element={<ApplicationDetailPage />} />
        <Route path="/office/users" element={<UsersPage />} />
        <Route path="/office/customers" element={<CustomerManagementPage />} />
        <Route path="/office/customers/:id" element={<OfficeCustomerDetailPage />} />
        <Route path="/office/audit-trail" element={<AuditTrailPage />} />
        <Route path="/office/audits" element={<AuditsPage />} />
        <Route path="/office/settings" element={<OfficeSettingsPage />} />
        <Route path="/office/certificate-designer" element={<CertificateDesignerPage />} />
        <Route path="/verify/:key" element={<CertificateVerifyPage />} />
        <Route path="/customer/login" element={<CustomerLogin />} />
        <Route path="/customer/register" element={<CustomerRegister />} />
        <Route path="/customer/dashboard" element={<CustomerDashboard />} />
        <Route path="/customer/applications" element={<CustomerApplicationsPage />} />
        <Route path="/customer/applications/:id" element={<Navigate to="/customer/applications" replace />} />
        <Route path="/customer/certificates" element={<CustomerCertificatesPage />} />
        <Route path="/customer/apply" element={<CustomerApplyPage />} />
        <Route path="/customer/factories" element={<CustomerFactoriesPage />} />
        <Route path="/customer/products" element={<CustomerProductsPage />} />
        <Route path="/customer/profile" element={<CustomerProfilePage />} />
      </Routes>
    </BrowserRouter>
  );
}
