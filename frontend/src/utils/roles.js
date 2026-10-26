export const roleHome = {
  EMPLOYEE: "/employee",
  DIRECTOR: "/director",
  ACCOUNTS: "/accounts",
};

export const getRoleHome = (role) =>
  roleHome[String(role || "").trim().toUpperCase()] || "/login";