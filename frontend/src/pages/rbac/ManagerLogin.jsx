import { FaUserTie } from "react-icons/fa";
import RoleLoginForm from "../../components/rbac/RoleLoginForm";
import { useRbacAuth } from "../../context/RbacAuthContext";

function ManagerLogin() {
  const { loginManager } = useRbacAuth();

  return (
    <RoleLoginForm
      role="manager"
      roleLabel="Manager"
      accent="#2dd4bf"
      icon={<FaUserTie />}
      description="Manage inventory, orders, and staff. Account created by an Admin."
      onLogin={(email, password) => loginManager(email, password)}
      dashboardPath="/manager/dashboard"
    />
  );
}

export default ManagerLogin;
