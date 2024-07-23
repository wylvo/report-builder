import View from "../../_views/View.js";

class AuthView extends View {
  #email = document.querySelector("#email");
  #password = document.querySelector("#password");
  #authForm = document.querySelector("#auth");
  #signOutBtn = document.querySelector("#sign-out");

  constructor() {
    super();
  }

  addHandlerSignIn(handler) {
    this.#authForm.addEventListener("submit", (e) => {
      e.preventDefault();
      handler(this.#email.value, this.#password.value);
    });
  }

  addHandlerSignOut(handler) {
    this.#signOutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      handler();
    });
  }
}

export default new AuthView();
