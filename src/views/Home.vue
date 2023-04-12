<script setup lang="ts">
import { db } from "../utils/db";
import { doc, setDoc } from "firebase/firestore";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { goDashboard } from "../utils";
import { set } from "../store";

const provider = new GoogleAuthProvider();
const auth = getAuth();

const logInGoogle = () => {
  signInWithPopup(auth, provider).then(async (result) => {
    await createUser(result.user);
  });
};

const createUser = async (user: any) => {
  try {
    await setDoc(
      doc(db, "users", user.uid),
      {
        nickname: user.displayName.split(" ")[0],
        name: user.displayName,
        email: user.email,
      },
      { merge: true }
    );
    set.uid(user.uid);
  } catch (error) {
    console.log(error);
  } finally {
    goDashboard();
  }
};
</script>

<template>
  <q-parallax
    src="https://images.pexels.com/photos/57043/pexels-photo-57043.jpeg"
    :height="720"
  >
    <div class="glass text-center">
      <h3>Movie time!</h3>
      <q-btn @click="logInGoogle()">
        <q-img
          width="20px"
          height="20px"
          src="../assets/iconGoogle.svg"
          spinner-size="20px"
        ></q-img
        ><span class="q-ml-xs">Sign In</span></q-btn
      >
    </div>
  </q-parallax>
</template>

<style scoped>
.glass {
  /* From https://css.glass */
  background: rgba(255, 255, 255, 0.4);
  border-radius: 16px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 5% 6%;
}
</style>
