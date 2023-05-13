<script setup lang="ts">
import { db } from "../utils/db";
import { addDoc, collection, doc, Timestamp } from "firebase/firestore";
import { reactive } from "vue";
import { Movie, User, FormAddView, TreeMovies } from "../types";
import { get } from "../store";
import { media, movieType } from "../utils/constants";
import { getImageUrl } from "../utils";

const props = defineProps<{ movies: Movie[]; users: User[] }>();
const emit = defineEmits(["movieAdded"]);

const form = reactive<FormAddView>({
  movie: props.movies[0],
  date: new Date().toISOString().substring(0, 10),
  stars: 3,
  friends: [],
  desc: "",
  media: movieType.MOVIE,
});

const getFormattedTitle = (title: string): [string, number, number, string] => {
  const fullSplit = title.split(" - ");
  const chapter = fullSplit.pop() || "";
  const firstPart = fullSplit.join().split(" ");

  const [seasson, episode] = firstPart.pop()!.split("x");
  const serie = firstPart.join(" ");

  return [
    serie,
    Number(seasson.substring(1)),
    Number(episode.substring(1)),
    chapter,
  ];
};

const prepareTreeMovies = (listMovies: Movie[]): TreeMovies[] => {
  const response: TreeMovies[] = [];

  listMovies.forEach((movie) => {
    const firstLetter = movie.title.charAt(0);

    if (!response.find((x) => x.letter === firstLetter)) {
      response.push({ letter: firstLetter, data: [] });
    }

    const letterIndex = response.findIndex((x) => x.letter === firstLetter);

    if (movie.type === movieType.MOVIE) {
      const prepareTree = { ...movie, label: movie.title };
      response[letterIndex].data.push(prepareTree);
    }

    if (movie.type === movieType.SERIE) {
      const [serie, seasson, episode, chapter] = getFormattedTitle(movie.title);
      const serieIndex = response[letterIndex].data.findIndex(
        (x) => x.title === serie
      );

      if (serieIndex > -1) {
        const seassonIndex = response[letterIndex].data[
          serieIndex
        ].children!.findIndex((x) => x.seasson === seasson);

        if (seassonIndex > -1) {
          const preparedData = {
            title: chapter,
            episode: episode,
            id: movie.id,
            label: movie.title,
            year: movie.year,
          };
          response[letterIndex].data[serieIndex].children![
            seassonIndex
          ].children.push(preparedData);
        } else {
          const preparedData = {
            seasson: seasson,
            children: [
              {
                title: chapter,
                episode: episode,
                id: movie.id,
                label: movie.title,
                year: movie.year,
              },
            ],
          };
          response[letterIndex].data[serieIndex].children?.push(preparedData);
        }
      } else {
        const preparedData = {
          title: serie,
          img: movie.img,
          children: [
            {
              seasson: seasson,
              children: [
                {
                  title: chapter,
                  episode: episode,
                  id: movie.id,
                  year: movie.year,
                  label: movie.title,
                },
              ],
            },
          ],
        };
        response[letterIndex].data.push(preparedData);
      }
    }
  });
  console.log(response);
  return response;
};

const treeMovies: TreeMovies[] = prepareTreeMovies(props.movies);

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
  <q-card class="q-pa-lg">
    <q-card-section class="q-gutter-lg">
      <q-select
        v-model="form.movie"
        :options="treeMovies"
        outlined
        label="Movie"
      >
        <template v-slot:option="scope">
          <q-expansion-item expand-separator>
            <template v-slot:header>
              <q-item-section>
                <q-item-label class="text-center font-weight-bold">{{
                  scope.opt.letter
                }}</q-item-label>
              </q-item-section>
            </template>
            <q-expansion-item
              v-for="item of scope.opt.data"
              :key="item.id"
              :label="item.title"
              :hide-expand-icon="!item.children"
              v-close-popup="!item.children"
              expand-separator
              @click="handleExpandableMovie(item)"
            >
              <template v-slot:header>
                <q-item-section avatar>
                  <q-img :src="item.img" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ item.title }}</q-item-label>
                  <q-item-label caption>{{ item.year }}</q-item-label>
                </q-item-section>
              </template>
              <q-expansion-item
                v-for="seasson of item.children"
                :key="seasson"
                :header-inset-level="1"
                :label="`Seasson ${seasson.seasson}`"
              >
                <q-expansion-item
                  v-for="episode of seasson.children"
                  :key="episode"
                  :header-inset-level="2"
                  :label="`Ep.${episode.episode} - ${episode.title}`"
                  :caption="episode.year"
                  hide-expand-icon
                  v-close-popup
                  @click="handleExpandableMovie(episode)"
                />
              </q-expansion-item>
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
    <q-card-actions align="right">
      <q-btn class="q-mr-sm" outline icon="close" color="red" v-close-popup />
      <q-btn
        outline
        icon="check"
        color="green"
        v-close-popup
        @click="addMovie()"
      />
    </q-card-actions>
  </q-card>
</template>
