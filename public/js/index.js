import "@babel/polyfill";
import { login, logout } from "./login";

//DOM elements

const form = document.querySelector(".form");
const logoutBtn = document.querySelector(".nav__el--logout");

form?.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  login(email, password);
  console.log(email, password);
});

logoutBtn?.addEventListener("click", logout);
