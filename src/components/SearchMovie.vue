<script setup lang="ts">
import { reactive } from "vue";
import { getImageUrl } from "../utils";
import { media } from "../utils/constants";
import { Search } from "../types";

const search = reactive<Search>({
  title: "",
  viewDate: new Date().toISOString(),
  viewYear: new Date().getFullYear(),
  year: new Date().getFullYear(),
  media: [],
  movieYear: new Date().getFullYear(),
});

const emit = defineEmits<{
  (e: "doSearch", search: any): any;
}>();

const handleSearch = () => {
  emit("doSearch", search);
};
</script>

<template>
  <q-card class="q-pa-lg">
    <q-form class="q-gutter-md flex">
      <q-input
        v-model="search.title"
        label="Movie name"
        outlined
        type="search"
        style="width: 180px"
        @update:model-value="handleSearch()"
        clearable
      />
      <q-select
        v-model="search.media"
        :options="[...media.values()]"
        outlined
        label="Media"
        options-selected-class="text-bold"
        class="text-capitalize"
        style="width: 120px"
        multiple
        clearable
        @update:model-value="handleSearch()"
        @clear="(search.media = []), handleSearch()"
      >
        <template v-slot:option="scope">
          <q-item v-bind="scope.itemProps">
            <q-item-section avatar>
              <q-img
                :src="getImageUrl(scope.opt)"
                fit="contain"
                height="28px"
                width="28px"
                no-spinner
              />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-capitalize">{{
                scope.opt
              }}</q-item-label>
            </q-item-section>
          </q-item>
        </template>
      </q-select>
    </q-form>
  </q-card>
</template>
