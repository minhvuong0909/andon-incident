import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:4000",
});

export const getProfile = async () => {
  console.log("vào chưa");

  return api.get("/conveyor");
};
