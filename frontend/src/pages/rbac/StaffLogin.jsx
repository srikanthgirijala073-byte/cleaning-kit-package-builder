import { FaHardHat } from "react-icons/fa";
import RoleLoginForm from "../../components/rbac/RoleLoginForm";
import { useRbacAuth } from "../../context/RbacAuthContext";

function StaffLogin() {
  const { loginStaff } = useRbacAuth();

  return (
    <RoleLoginForm
      role="staff"
      roleLabel="Staff"
      accent="#f5a524"
      icon={<FaHardHat />}
      description="Handle day-to-day orders and product tasks. Account created by an Admin."
      onLogin={(email, password) => loginStaff(email, password)}
      dashboardPath="/staff/dashboard"
    />
  );
}

export default StaffLogin;
