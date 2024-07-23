import auth from "../auth.js";
import notificationsView from "../_views/notificationsView.js";
import authView from "./views/authView.js";

const controlSignIn = async function (email, password) {
  if (!email || !password)
    return notificationsView.error("Please provide both email & password.");
  try {
    const { _, data } = await auth.signIn(email, password);

    if (data.status === "success") {
      notificationsView.success("You have successfully signed in.", 3);
      location.assign("/");
    }
  } catch (error) {
    console.error(error);
    notificationsView.error(error.message);
  }
};

const controlSignOut = async function () {
  try {
    const { _, data } = await auth.signOut();

    if (data.status === "success") {
      notificationsView.success("You have successfully signed out.", 3);
      location.assign("/signin");
    }
  } catch (error) {
    console.error(error);
    notificationsView.error(error.message);
  }
};

if (window.location.pathname.startsWith("/signin"))
  authView.addHandlerSignIn(controlSignIn);
else authView.addHandlerSignOut(controlSignOut);
