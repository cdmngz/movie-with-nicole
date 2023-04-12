<script setup lang="ts">
import { goDashboard, goHome } from "../utils";
import { getAuth, signOut } from "firebase/auth";
import { get } from "../store";

if (get.uid()) {
  goDashboard();
} else {
  goHome();
}

const logOut = () => {
  const auth = getAuth();
  signOut(auth).then(() => {
    goHome();
  });
};
</script>

<template>
  <q-layout view="lHh lpr lFf" style="min-height: 100vh">
    <q-header elevated>
      <q-toolbar>
        <q-avatar square>
          <img src="../assets/popCorn.png" />
        </q-avatar>
        <q-toolbar-title>Movie with Nicole</q-toolbar-title>

        <q-tabs v-if="get.uid()">
          <q-route-tab icon="dashboard" to="/dashboard" exact />
          <q-route-tab icon="menu" exact
            ><q-menu>
              <q-list style="min-width: 100px">
                <q-item clickable v-close-popup to="/settings">
                  <q-item-section>Settings</q-item-section>
                </q-item>
                <q-separator />
                <q-item clickable v-close-popup @click="logOut()">
                  <q-item-section>Log Out</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-route-tab>
        </q-tabs>
      </q-toolbar>
    </q-header>
    <q-page-container>
      <q-page>
        <router-view></router-view>
      </q-page>
    </q-page-container>
  </q-layout>
</template>
