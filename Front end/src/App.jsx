import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom"
import Login from './pages/Login';
import Register from './pages/Register';
import Layout from './components/Layout/Layout';
import ShowCompanies from './pages/ShowCompanies';
import ShowCompany from './pages/ShowCompany';
import ShowDepartments from './pages/ShowDepartments';
import ShowEmployees from './pages/ShowEmployees';
import ShowUsers from './pages/ShowUsers';
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
        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route element={<DashboardLayout />}>
          {/* Admin + Manager + Employee */}
          <Route element={<ProtectedRoute allowedRoles={["Admin", "Manager", "Employee"]} />}>
            <Route path="/departments" element={<ShowDepartments />} />
          </Route>

          {/* Admin فقط */}
          <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
            <Route path="/companies" element={<ShowCompanies />} />
            <Route path="/company/:id" element={<ShowCompany />} />
            <Route path="/update/company/:id" element={<UpdateCompany />} />
            <Route path="/update/department/:id" element={<UpdateDepartment />} />
            <Route path="/update/employee/:id" element={<UpdateEmployee />} />
            <Route path="/department/:id" element={<ShowDepartment />} />
            <Route path="/employee/:id" element={<ShowEmployee />} />
            <Route path="/employees" element={<ShowEmployees />} />
            <Route path="/users" element={<ShowUsers />} />
            <Route path="/add-company" element={<CreateCompany />} />
            <Route path="/add-department" element={<CreateDepartment />} />
            <Route path="/add-employee" element={<CreateEmployee />} />
            <Route path="/add-user" element={<CreateUser />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;


