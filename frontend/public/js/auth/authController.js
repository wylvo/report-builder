import auth from "../model/auth.js";
import notificationsView from "../notifiations/notificationsView.js";
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
    notificationsView.error(error.message);
  }
};

const init = async function () {
  authView.addHandlerSignIn(controlSignIn);
};

init();
