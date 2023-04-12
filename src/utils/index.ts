import router from "../router";

export const goHome = () => {
  router.push({ path: "/" });
};

export const goDashboard = () => {
  router.push({ path: "/dashboard" });
};

export const getImageUrl = (imgName: string | undefined) => {
  return new URL(`../assets/${imgName}.svg`, import.meta.url).href;
};
