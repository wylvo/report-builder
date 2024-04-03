import auth from "../model/auth.js";
import notificationView from "../views/notifications/notificationView.js";
import signInView from "../views/signInView.js";

const controlSignIn = async function (email, password) {
  if (!email || !password)
    return notificationView.error("Please provide both email & password.");
  try {
    const { response, data } = await auth.signIn(email, password);

    if (data.status === "success") {
      notificationView.success("You have successfully signed in.", 3);
      location.assign("/");
    }
  } catch (error) {
    notificationView.error(error.message);
  }
};

const init = async function () {
  signInView.addHandlerSignIn(controlSignIn);
};

init();
