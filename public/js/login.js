import axios from "axios";
import { showAlert } from "./alert";

export async function login(email, password) {
  try {
    const res = await axios({
      method: "POST",
      url: "http://localhost:3000/api/v1/users/login",
      data: { email, password },
    });
    if (res.data.status === "success") {
      showAlert("success", "Logged In Successfully");
      window.setTimeout(() => {
        location.assign("/");
      }, 1000);
    }
  } catch (err) {
    showAlert("error", err.response.data.message);
  }
}

export const logout = async () => {
  try {
    const res = await axios({
      method: "GET",
      url: "http://localhost:3000/api/v1/users/logout",
    });

    if (res.data.status == "success") location.reload(true);
  } catch (err) {
    showAlert("error", "ERror logging out! Try again ");
  }
};
