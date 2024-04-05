export const getDashboard = (req, res) => {
  res.status(200).render("dashboard");
};

export const getReports = (req, res) => {
  res.status(200).render("reports");
};

export const getusers = (req, res) => {
  res.status(200).render("users");
};

export const getAccount = (req, res) => {
  console.log(req.user);

  res
    .status(200)
    .render("account", { profilePicture: req.user.profilePictureURL });
};

export const getSignInForm = (req, res) => {
  res.status(200).render("signin");
};
