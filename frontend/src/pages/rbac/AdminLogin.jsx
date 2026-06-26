import { FaUserShield } from "react-icons/fa";
import RoleLoginForm from "../../components/rbac/RoleLoginForm";
import { useRbacAuth } from "../../context/RbacAuthContext";

function AdminLogin() {
  const { loginAdmin } = useRbacAuth();

  return (
    <RoleLoginForm
      role="admin"
      roleLabel="Admin"
      accent="#a78bfa"
      icon={<FaUserShield />}
      description="Full system access. Reserved for the Super Admin account only."
      onLogin={(email, password) => loginAdmin(email, password)}
      dashboardPath="/admin/dashboard"
    />
  );
}

export default AdminLogin;
