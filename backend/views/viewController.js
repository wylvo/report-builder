export const getMainPage = (req, res) => {
  res.status(200).render("index");
};

export const getSignInForm = (req, res) => {
  res.status(200).render("signin");
};
