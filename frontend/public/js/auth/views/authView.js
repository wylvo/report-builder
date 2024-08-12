import View from "../../_views/View.js";

class AuthView extends View {
  #email = document.querySelector("#email");
  #password = document.querySelector("#password");
  #authForm = document.querySelector("#auth");
  #signOutSidebarBtn = document.querySelector("#sign-out-sidebar");
  #signOutNavbarBtn = document.querySelector("#sign-out-navbar");

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
    this.#signOutSidebarBtn.addEventListener("click", (e) => {
      e.preventDefault();
      handler();
    });

    this.#signOutNavbarBtn.addEventListener("click", (e) => {
      e.preventDefault();
      handler();
    });
  }
}

export default new AuthView();
