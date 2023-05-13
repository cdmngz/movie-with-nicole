<script setup lang="ts">
import MainLayout from "./layouts/MainLayout.vue";

import { getAuth, onAuthStateChanged } from "firebase/auth";
import { set } from "./store";
import { ref } from "vue";

const auth = getAuth();
const loading = ref(true);

onAuthStateChanged(auth, (user) => {
  if (user) {
    set.uid(user.uid);
  } else {
    set.uid("");
  }
  loading.value = false;
});
</script>

<template>
  <div v-if="loading" class="text-center q-ma-xl q-pa-xl">
    <q-spinner size="xl" color="secondary" />
  </div>
  <MainLayout v-else></MainLayout>
</template>
