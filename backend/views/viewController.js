export const getDashboard = (req, res) => {
  res.status(200).render("dashboard", {
    title: "Dashboard",
    script: "dashboardController.js",
    profilePicture: "",
  });
};

export const getReports = (req, res) => {
  res.status(200).render("reports", {
    title: "Reports",
    script: "reportController.js",
    profilePicture: "",
  });
};

export const getusers = (req, res) => {
  res.status(200).render("users", {
    title: "Users",
    script: "userController.js",
    profilePicture: "",
  });
};

export const getAccount = (req, res) => {
  console.log(req.user);

  res.status(200).render("account", {
    title: "Your Account",
    script: "accountController.js",
    profilePicture: req.user.profilePictureURL,
  });
};

export const getSignInForm = (req, res) => {
  res.status(200).render("signin", {
    title: "Sign In",
    script: "authController.js",
  });
};
