export const getDashboard = (_, res) => {
  res.status(200).render("dashboard", {
    title: "Dashboard",
    scriptPath: "/js/dashboard/dashboardController.js",
  });
};

export const getReports = (_, res) => {
  res.status(200).render("reports", {
    title: "Reports",
    scriptPath: "/js/reports/reportController.js",
  });
};

export const getUsers = (_, res) => {
  res.status(200).render("users", {
    title: "Users",
    scriptPath: "/js/users/userController.js",
  });
};

export const getAccount = (_, res) => {
  res.status(200).render("account", {
    title: "Your Account",
    scriptPath: "/js/account/accountController.js",
  });
};

export const getEvents = (_, res) => {
  res.status(200).render("events", {
    title: "Events",
    scriptPath: "/js/events/eventController.js",
  });
};

export const getSignInForm = (_, res) => {
  res.status(200).render("auth", {
    title: "Sign In",
    scriptPath: "/js/auth/authController.js",
  });
};
