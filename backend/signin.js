import { readFile } from "fs/promises";
import { comparePasswords, createJWT } from "./auth.js";

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
  // TO DO (query user email from DB)
  const users = JSON.parse(
    await readFile("./backend/data/users.json", "utf-8")
  );
  const user = users.find((user) => user.email === email);

  if (!user || !(await comparePasswords(password, user.password))) {
    res.status(401).json({
      status: "failed",
      message: "Incorrect email or password",
    });
  } else {
    // If everything is ok, send the token to client
    console.log(password, user.password);
    createJWT(user, res, 200);
  }
};
