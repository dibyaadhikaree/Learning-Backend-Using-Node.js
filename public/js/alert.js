export const showAlert = (type, msg) => {
  const markup = `<div class ="alert alert--${type}">${msg}</div>`;
  document.querySelector("body").insertAdjacentHTML("afterbegin", markup);
};

export const hideAlert = () => {
  hideAlert();
  const el = document.querySelector(".alert");
  if (el) el.parentElement.removeChild(el);
  setTimeout(hideAlert, 2000);
};
