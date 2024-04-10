export const getDashboard = (req, res) => {
  res.status(200).render("dashboard", {
    title: "Dashboard",
    scriptPath: "/js/controllers/dashboardController.js",
  });
};

export const getReports = (req, res) => {
  res.status(200).render("reports", {
    title: "Reports",
    scriptPath: "/js/controllers/reportController.js",
  });
};

export const getusers = (req, res) => {
  res.status(200).render("users", {
    title: "Users",
    scriptPath: "/js/controllers/userController.js",
  });
};

export const getAccount = (req, res) => {
  res.status(200).render("account", {
    title: "Your Account",
    scriptPath: "/js/controllers/accountController.js",
  });
};

export const getSignInForm = (req, res) => {
  res.status(200).render("signin", {
    title: "Sign In",
    scriptPath: "/js/controllers/authController.js",
  });
};
