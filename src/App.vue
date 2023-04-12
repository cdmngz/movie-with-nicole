<script setup lang="ts">
import MainLayout from "./layouts/MainLayout.vue";

import { getAuth, onAuthStateChanged } from "firebase/auth";
import { set } from "./store";
import { ref } from "vue";
import { useQuasar } from "quasar";

const $q = useQuasar();
const auth = getAuth();
const loading = ref(true);

$q.loading.show();

onAuthStateChanged(auth, (user) => {
  if (user) {
    set.uid(user.uid);
  } else {
    set.uid("");
  }
  $q.loading.hide();
  loading.value = false;
});
</script>

<template>
  <MainLayout v-if="!loading"></MainLayout>
</template>
