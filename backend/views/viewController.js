export const getDashboard = (req, res) => {
  res.status(200).render("dashboard", {
    title: "Dashboard",
    scriptPath: "/js/controllers/dashboardController.js",
    profilePicture: "",
  });
};

export const getReports = (req, res) => {
  res.status(200).render("reports", {
    title: "Reports",
    scriptPath: "/js/controllers/reportController.js",
    profilePicture: "",
  });
};

export const getusers = (req, res) => {
  res.status(200).render("users", {
    title: "Users",
    scriptPath: "/js/controllers/userController.js",
    profilePicture: "",
  });
};

export const getAccount = (req, res) => {
  console.log(req.user);

  res.status(200).render("account", {
    title: "Your Account",
    scriptPath: "/js/controllers/accountController.js",
    profilePicture: req.user.profilePictureURL,
  });
};

export const getSignInForm = (req, res) => {
  res.status(200).render("signin", {
    title: "Sign In",
    scriptPath: "/js/controllers/authController.js",
  });
};
