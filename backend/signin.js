import { comparePasswords, createJWT } from "./auth.js";
import catchAsync from "./errors/catchAsync.js";

export const signIn = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email & password exist
  if (!email || !password) {
    res.status(400).json({
      status: "failed",
      message: "Please sign in by providing both email and password.",
    });
  }

  // Check if user exists && password is correct
  const mssql = req.app.locals.mssql;
  const {
    recordset: [user],
  } = await mssql.query(`SELECT * FROM users WHERE email = '${email}'`);

  if (!user || !(await comparePasswords(password, user.password))) {
    res.status(401).json({
      status: "failed",
      message: "Incorrect email or password",
    });
  } else {
    // If everything is ok, send the token to client
    createJWT(user, res, 200);
  }
});
