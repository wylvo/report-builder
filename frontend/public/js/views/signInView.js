import View from "./View.js";

class SignInView extends View {
  #email = document.querySelector("#email");
  #password = document.querySelector("#password");
  #signInForm = document.querySelector("#sign-in");

  constructor() {
    super();
  }

  addHandlerSignIn(handler) {
    this.#signInForm.addEventListener("submit", (e) => {
      e.preventDefault();
      handler(this.#email.value, this.#password.value);
    });
  }
}

export default new SignInView();
