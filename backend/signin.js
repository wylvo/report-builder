export const signIn = async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email & password exist
  if (!email || !password) {
    res.status(400).json({
      status: "failed",
      message: "Please sign in with both email and password",
    });
  }

  // Check if user exists && password is correct
};
