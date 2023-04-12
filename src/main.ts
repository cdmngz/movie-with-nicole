import { createApp } from "vue";
import router from "./router";
import App from "./App.vue";
import { Quasar, Loading } from "quasar";
import "@quasar/extras/material-icons/material-icons.css";
import "quasar/src/css/index.sass";

createApp(App)
  .use(Quasar, {
    plugins: { Loading },
    config: {
      loading: {},
    },
  })
  .use(router)
  .mount("#app");
