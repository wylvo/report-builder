import View from "../../View.js";

class AuthView extends View {
  #email = document.querySelector("#email");
  #password = document.querySelector("#password");
  #authForm = document.querySelector("#auth");

  constructor() {
    super();
  }

  addHandlerSignIn(handler) {
    this.#authForm.addEventListener("submit", (e) => {
      e.preventDefault();
      handler(this.#email.value, this.#password.value);
    });
  }
}

export default new AuthView();
