export const getDashboard = (req, res) => {
  res.status(200).render("dashboard");
};

export const getReports = (req, res) => {
  res.status(200).render("reports");
};

export const getusers = (req, res) => {
  res.status(200).render("users");
};

export const getSignInForm = (req, res) => {
  res.status(200).render("signin");
};
