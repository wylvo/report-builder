import { comparePasswords, createJWT } from "./auth.js";
import { mssqlRequest } from "./config/db.config.js";
import GlobalError from "./errors/globalError.js";
import catchAsync from "./errors/catchAsync.js";

export const signIn = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email & password exist
  if (!email || !password) {
    return next(
      new GlobalError(
        "Please sign in by providing both email and password.",
        400
      )
    );
  }

  // Check if user exists && password is correct
  const request = mssqlRequest();
  const {
    recordset: [user],
  } = await request
    .input("email", email)
    .query("SELECT * FROM users WHERE email = @email");

  if (!user || !(await comparePasswords(password, user.password)))
    return next(new GlobalError("Incorrect email or password", 401));

  // If everything is ok, send the token to client
  createJWT(user, res, 200);
});
