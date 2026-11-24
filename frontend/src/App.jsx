import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom"
import Login from './pages/Login';
import Register from './pages/Register';
import Layout from './components/Layout/Layout';
import ShowCompanies from './pages/ShowCompanies';
import ShowCompany from './pages/ShowCompany';
import ShowDepartments from './pages/ShowDepartments';
import ShowEmployees from './pages/ShowEmployees';
import ShowUsers from './pages/ShowUsers';
import ShowUser from './pages/ShowUser';
import UpdateUser from './pages/UpdateUser';
import CreateCompany from './pages/CreateCompany';
import CreateDepartment from './pages/CreateDepartment';
import CreateEmployee from './pages/CreateEmployee';
import CreateUser from './pages/CreateUser';
import Unauthorized from './Unauthorized';
import ProtectedRoute from './ProtectedRoute';
import ShowDepartment from "./pages/ShowDepartment";
import ShowEmployee from "./pages/ShowEmployee";
import UpdateCompany from './pages/UpdateCompany';
import UpdateDepartment from "./pages/UpdateDepartment";
import UpdateEmployee from './pages/UpdateEmployee';
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import EmployeeReport from "./pages/EmployeeReport";
import { ADMIN_AND_MANAGER, ADMIN_ONLY, ALL_ROLES } from "./utilis/auth";

const DashboardLayout = () => (
  <Layout>
    <Outlet />
  </Layout>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/landingpage" element={<LandingPage />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route element={<DashboardLayout />}>
          {/* Admin + Manager + Employee (read-only for Employee) */}
          <Route element={<ProtectedRoute allowedRoles={ALL_ROLES} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/departments" element={<ShowDepartments />} />
            <Route path="/landingpage" element={<LandingPage />} />
          </Route>

          {/* Admin + Manager: view companies/departments/employees, manage departments & employees, reports */}
          <Route element={<ProtectedRoute allowedRoles={ADMIN_AND_MANAGER} />}>
            <Route path="/companies" element={<ShowCompanies />} />
            <Route path="/company/:id" element={<ShowCompany />} />
            <Route path="/department/:id" element={<ShowDepartment />} />
            <Route path="/employee/:id" element={<ShowEmployee />} />
            <Route path="/employees" element={<ShowEmployees />} />
            <Route path="/reports" element={<EmployeeReport />} />
            <Route path="/add-department" element={<CreateDepartment />} />
            <Route path="/add-employee" element={<CreateEmployee />} />
            <Route path="/update/department/:id" element={<UpdateDepartment />} />
            <Route path="/update/employee/:id" element={<UpdateEmployee />} />
          </Route>

          {/* Admin فقط: companies write + users */}
          <Route element={<ProtectedRoute allowedRoles={ADMIN_ONLY} />}>
            <Route path="/update/company/:id" element={<UpdateCompany />} />
            <Route path="/add-company" element={<CreateCompany />} />
            <Route path="/users" element={<ShowUsers />} />
            <Route path="/user/:id" element={<ShowUser />} />
            <Route path="/update/user/:id" element={<UpdateUser />} />
            <Route path="/add-user" element={<CreateUser />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;


