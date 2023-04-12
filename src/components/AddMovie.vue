<script setup lang="ts">
import { db } from "../utils/db";
import { addDoc, collection, doc, Timestamp } from "firebase/firestore";
import { reactive } from "vue";
import { Movie, User, FormAddView, MovieTree } from "../types";
import { get } from "../store";
import { media } from "../utils/constants";
import { getImageUrl } from "../utils";

const props = defineProps<{ movies: Movie[]; users: User[] }>();
const emit = defineEmits(["movieAdded"]);

const treeMovies: MovieTree[] = [];

const form = reactive<FormAddView>({
  movie: props.movies[0],
  date: new Date().toISOString().substring(0, 10),
  stars: 3,
  friends: [],
  desc: "",
  media: 1,
});

const prepareTreeMovies = (listMovies: Movie[]) => {
  listMovies.forEach((movie) => {
    if (movie.type === 1) {
      treeMovies.push({
        label: movie.title,
        img: movie.img,
        id: movie.id,
        tag: movie.title,
        year: movie.year,
        children: [],
      });
    } else {
      const fullSplit = movie.title.split(" - ");
      const firstPart = fullSplit.shift();
      const serieName = firstPart
        ? firstPart.split(" ").slice(0, -1).join(" ")
        : "";
      const chapterName = fullSplit.pop();
      const chapters = firstPart?.split(" ").pop()?.split("x");
      const seasson = chapters?.shift()?.substring(1);
      const episode = chapters?.pop()?.substring(1);
      const treeMovieIndex = treeMovies.findIndex(
        (tree) => tree.tag === serieName
      );
      if (treeMovieIndex > -1) {
        const treeSeassonIndex = treeMovies[treeMovieIndex].children.findIndex(
          (child) => child.tag === `Seasson ${seasson}`
        );
        if (treeSeassonIndex > -1) {
          treeMovies[treeMovieIndex].children[treeSeassonIndex].children.push({
            tag: `Ep. ${episode} - ${chapterName}`,
            id: movie.id,
            label: movie.title,
            year: movie.year,
            children: [],
          });
        } else {
          treeMovies[treeMovieIndex].children.push({
            tag: `Seasson ${seasson}`,
            children: [
              {
                tag: `Ep. ${episode} - ${chapterName}`,
                id: movie.id,
                label: movie.title,
                year: movie.year,
                children: [],
              },
            ],
          });
        }
      } else {
        treeMovies.push({
          tag: serieName,
          img: movie.img,
          children: [
            {
              tag: `Seasson ${seasson}`,
              children: [
                {
                  tag: `Ep. ${episode} - ${chapterName}`,
                  id: movie.id,
                  year: movie.year,
                  label: movie.title,
                  children: [],
                },
              ],
            },
          ],
        });
      }
    }
  });
};

prepareTreeMovies(props.movies);

const addMovie = async () => {
  const movieId = form.movie.id;
  if (movieId) {
    const preparedData = {
      movie: doc(db, "movies", movieId),
      date: Timestamp.fromDate(new Date(form.date)),
      stars: form.stars,
      friends: form.friends.map((friend: User) => doc(db, "users", friend.id)),
      desc: form.desc,
      media: form.media,
    };
    preparedData.friends.push(doc(db, "users", get.uid()));
    try {
      addDoc(collection(db, "views"), preparedData);
      emit("movieAdded");
    } catch (error) {
      console.log(error);
    }
  }
};

const handleExpandableMovie = (value: Movie) => {
  if (value.id && value.label) {
    form.movie = value;
  }
};
</script>

<template>
  <q-card class="q-py-md q-px-xl">
    <q-card-section class="row items-center">
      <q-space />
      <q-btn icon="close" color="red" flat round dense v-close-popup />
    </q-card-section>
    <q-card-section class="q-gutter-md">
      <q-select
        v-model="form.movie"
        :options="treeMovies"
        outlined
        label="Movie"
      >
        <template v-slot:option="scope">
          <q-expansion-item
            expand-separator
            :hide-expand-icon="!scope.opt.children.length"
            @click="handleExpandableMovie(scope.opt)"
          >
            <template v-slot:header>
              <q-item-section avatar>
                <q-img :src="scope.opt.img" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ scope.opt.tag }}</q-item-label>
                <q-item-label caption>{{ scope.opt.year }}</q-item-label>
              </q-item-section>
            </template>
            <q-expansion-item
              v-for="seasson of scope.opt.children"
              :key="seasson"
              :header-inset-level="1"
              :label="seasson.tag"
            >
              <q-expansion-item
                v-for="episode of seasson.children"
                :key="episode"
                :header-inset-level="2"
                :label="episode.tag"
                :caption="episode.year"
                hide-expand-icon
                @click="handleExpandableMovie(episode)"
              />
            </q-expansion-item>
          </q-expansion-item>
        </template>
      </q-select>
      <q-input v-model="form.date" type="date" label="Date" outlined></q-input>
      <q-rating v-model="form.stars" :max="5" size="xs" />
      <q-select
        outlined
        v-model="form.friends"
        :options="users"
        label="Friends"
        multiple
        use-chips
        emit-value
        map-options
      >
        <template v-slot:option="{ itemProps, opt, selected, toggleOption }">
          <q-item v-bind="itemProps">
            <q-item-section>
              <q-item-label>{{ opt.name.split(" ")[0] }}</q-item-label>
              <q-item-label caption>{{ opt.email.split("@")[0] }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-toggle
                :model-value="selected"
                @update:model-value="toggleOption(opt)"
              />
            </q-item-section>
          </q-item>
        </template>
        <template v-slot:no-option>
          <q-item>
            <q-item-section>
              <q-item-label class="text-grey">No more users</q-item-label>
            </q-item-section>
          </q-item>
        </template>
      </q-select>
      <q-input v-model="form.desc" label="Description" outlined></q-input>
      <q-card-section class="flex q-gutter-md">
        <q-btn
          fab-mini
          v-for="(item, index) of [...media.values()]"
          :key="index"
          :color="form.media === Number(index) + 1 ? 'primary' : 'white'"
          @click="form.media = Number(index) + 1"
        >
          <q-img
            :src="getImageUrl(item)"
            fit="contain"
            height="32px"
            width="32px"
            no-spinner
          />
          <q-tooltip
            anchor="bottom middle"
            self="top middle"
            :offset="[10, 10]"
          >
            <span class="text-subtitle2 text-capitalize">{{ item }}</span>
          </q-tooltip>
        </q-btn>
      </q-card-section>
    </q-card-section>
    <q-card-actions align="right" class="text-positive">
      <q-btn @click="addMovie()" outline icon="check" v-close-popup />
    </q-card-actions>
  </q-card>
</template>
