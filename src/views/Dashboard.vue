<script setup lang="ts">
import { ref, computed, reactive } from "vue";
import { db } from "../utils/db";
import {
  doc,
  updateDoc,
  collection,
  orderBy,
  query,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  getDocs,
  where,
} from "firebase/firestore";
import { Movie, View, User, Search } from "../types";
import AddMovie from "../components/AddMovie.vue";
import SearchMovie from "../components/SearchMovie.vue";
import { get } from "../store";
import { media } from "../utils/constants";
import { getImageUrl } from "../utils";

const show = ref<boolean>(false);
const movies = ref<Movie[]>([]);
const views = ref<View[]>([]);
const users = ref<User[]>([]);
const loading = ref<boolean>(false);
const tmpDescription = ref<string>("");
const friendsToAdd = ref<string[]>([]);
const search = reactive<Search>({
  title: "",
  viewDate: new Date().toISOString(),
  viewYear: new Date().getFullYear(),
  year: new Date().getFullYear(),
  media: [],
  movieYear: new Date().getFullYear(),
});

const listUsersToAdd = computed(() =>
  users.value.filter((user) => !friendsToAdd.value.includes(user.id))
);

const listViews = computed(() => {
  let response = views.value;
  if (search.media.length) {
    const listMedia: number[] = [];
    for (let [key, value] of media.entries()) {
      if (search.media.includes(value)) {
        listMedia.push(key);
      }
    }
    response = response.filter((view) => listMedia.includes(view.media));
  }

  if (search.title) {
    const listMovies = movies.value
      .filter((movie) =>
        movie.title
          .toLocaleLowerCase()
          .includes(search.title.toLocaleLowerCase())
      )
      .map((movie) => movie.id);
    response = response.filter((view) => listMovies.includes(view.movie.id));
  }
  return response;
});

const getMovies = async () => {
  movies.value = [];
  const q = query(collection(db, "movies"), orderBy("title"));

  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => {
    movies.value.push({
      id: doc.id,
      title: doc.data().title,
      year: doc.data().year,
      img: doc.data().img,
      label: doc.data().title,
      type: doc.data().type,
    });
  });
};

const getUserViews = async () => {
  views.value = [];

  const q = query(
    collection(db, "views"),
    where("friends", "array-contains", doc(db, "users", get.uid())),
    orderBy("date", "desc")
  );

  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => {
    views.value.push({
      id: doc.id,
      stars: doc.data().stars,
      date: doc.data().date.toDate(),
      movie: doc.data().movie,
      friends: doc
        .data()
        .friends.filter((friend: User) => friend.id !== get.uid()),
      desc: doc.data().desc,
      media: doc.data().media,
    });
  });
};

const getUsers = async () => {
  users.value = [];
  const q = query(collection(db, "users"), where("__name__", "!=", get.uid()));

  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => {
    users.value.push({
      id: doc.id,
      name: doc.data().name,
      label: doc.data().nickname,
      nickname: doc.data().nickname,
      email: doc.data().email,
    });
  });
};

const updateStars = async (stars: number, viewId: string) => {
  if (stars && viewId) {
    await updateDoc(doc(db, "views", viewId), {
      stars,
    });
  }
};

const updateDate = async (date: string, viewId: string) => {
  if (date && viewId) {
    await updateDoc(doc(db, "views", viewId), {
      date: new Date(date),
    });
    const viewIndex = views.value.findIndex((view) => view.id === viewId);
    if (viewIndex > -1) {
      views.value[viewIndex].date = date;
    }
  }
};

const updateMedia = async (media: number, viewId: string) => {
  if (media && viewId) {
    const viewIndex = views.value.findIndex((view) => view.id === viewId);
    if (viewIndex > -1) {
      views.value[viewIndex].media = media;
    }
    await updateDoc(doc(db, "views", viewId), {
      media,
    });
  }
};

const showAddMovie = () => {
  show.value = true;
};

const doSearch = (value: Search) => {
  loading.value = true;
  search.title = value.title;
  search.media = value.media;
  setTimeout(() => {
    loading.value = false;
  }, 200);
};

const movieAdded = async () => {
  loading.value = true;
  try {
    await getUserViews();
  } catch (error) {
    console.log(error);
  } finally {
    loading.value = false;
  }
};

const deleteView = async (viewId: string) => {
  loading.value = true;
  try {
    deleteDoc(doc(db, "views", viewId));
    const viewIndex = views.value.findIndex((view) => view.id === viewId);
    if (viewIndex > -1) {
      views.value.splice(viewIndex, 1);
    }
  } catch (error) {
    console.log(error);
  } finally {
    loading.value = false;
  }
};

const updateDescription = async (viewId: string, oldDescription: string) => {
  if (oldDescription !== tmpDescription.value && viewId) {
    try {
      await updateDoc(doc(db, "views", viewId), {
        desc: tmpDescription.value,
      });
      const viewIndex = views.value.findIndex((views) => views.id === viewId);
      views.value[viewIndex].desc = tmpDescription.value;
      tmpDescription.value = "";
    } catch (error) {
      console.log(error);
    }
  }
};

const removeUserFromView = async (viewId: string, user: User) => {
  if (viewId && user.id) {
    try {
      await updateDoc(doc(db, "views", viewId), {
        friends: arrayRemove(doc(db, "users", user.id)),
      });
      const viewIndex = views.value.findIndex((view) => view.id === viewId);
      if (viewIndex > -1) {
        const friendId = views.value[viewIndex].friends.findIndex(
          (friend) => friend.id === user.id
        );
        views.value[viewIndex].friends.splice(friendId, 1);
      }
    } catch (error) {
      console.log(error);
    }
  }
};

const handleViewFriends = (friends: User[]) => {
  friendsToAdd.value = friends
    .filter((friend) => friend.id !== get.uid())
    .map((friend) => friend.id);
};

const addUserToView = async (viewId: string, user: User) => {
  if (viewId && user.id) {
    try {
      await updateDoc(doc(db, "views", viewId), {
        friends: arrayUnion(doc(db, "users", user.id)),
      });
      views.value[
        views.value.findIndex((view) => view.id === viewId)
      ].friends.push({
        id: user.id,
        name: user.name,
        label: user.label,
        nickname: user.nickname,
        email: user.email,
      });
    } catch (error) {
      console.log(error);
    }
  }
};

const init = async () => {
  loading.value = true;
  await Promise.all([getMovies(), getUserViews(), getUsers()]).finally(
    () => (loading.value = false)
  );
};
init();
</script>

<template>
  <q-dialog v-model="show">
    <add-movie
      :movies="movies"
      :users="users"
      @movieAdded="movieAdded()"
    ></add-movie>
  </q-dialog>
  <search-movie
    class="q-mt-xl q-mx-xl"
    @show-add-movie="showAddMovie()"
    @do-search="doSearch"
  ></search-movie>
  <div class="text-caption text-grey text-right q-mr-xl q-my-xs">
    <p class="grey" v-show="listViews.length">
      <q-icon name="movie"></q-icon>
      {{ listViews.length }}
    </p>
  </div>
  <div v-if="loading" class="text-center q-ma-xl q-pa-xl">
    <q-spinner size="xl" color="secondary" />
  </div>
  <q-timeline
    v-else-if="listViews.length"
    :layout="
      $q.screen.lt.sm ? 'dense' : $q.screen.lt.md ? 'comfortable' : 'loose'
    "
  >
    <q-timeline-entry
      v-for="(item, index) of listViews"
      :side="index % 2 ? 'right' : 'left'"
    >
      <template v-slot:subtitle>
        <div>
          <q-btn-dropdown
            color="primary text-bold"
            flat
            dense
            no-icon-animation
            dropdown-icon="calendar_month"
            :label="new Date(item.date).toLocaleDateString()"
          >
            <q-date v-model="item.date" minimal>
              <div class="row items-center justify-end q-gutter-sm">
                <q-btn
                  label="OK"
                  color="green"
                  flat
                  @click="updateDate(item.date, item.id)"
                  v-close-popup
                />
              </div>
            </q-date>
          </q-btn-dropdown>
        </div>
      </template>
      <q-card
        :class="[
          'my-card',
          !$q.screen.lt.md && index % 2 === 0 ? 'float-right' : '',
        ]"
      >
        <q-img :src="movies.find((x) => x.id === item.movie.id)?.img" ratio="1">
          <q-fab
            color="transparent"
            :icon="`img:${getImageUrl(media.get(item.media))}`"
            direction="right"
            padding="sm"
            class="absolute-top-left bg-transparent"
          >
            <q-fab-action
              square
              external-label
              label-position="bottom"
              flat
              unelevated
            >
              <q-card
                style="width: 190px; margin-top: 100%"
                flat
                class="bg-transparent"
              >
                <q-card-section class="flex q-gutter-md bg-transparent">
                  <q-btn
                    fab-mini
                    v-for="(itemMedia, indexMedia) of [...media.values()]"
                    :key="indexMedia"
                    :color="
                      item.media === Number(indexMedia) + 1
                        ? 'primary'
                        : 'white'
                    "
                    @click="updateMedia(Number(indexMedia) + 1, item.id)"
                  >
                    <q-img
                      :src="getImageUrl(itemMedia)"
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
                      <span class="text-subtitle2 text-capitalize">{{
                        itemMedia
                      }}</span>
                    </q-tooltip>
                  </q-btn>
                </q-card-section>
              </q-card>
            </q-fab-action>
          </q-fab>
        </q-img>

        <q-card-section>
          <q-fab
            icon="menu"
            direction="down"
            padding="sm"
            color="primary"
            class="absolute"
            style="top: 0; right: 12px; transform: translateY(-50%)"
          >
            <q-fab-action
              icon="delete"
              color="red"
              @click="deleteView(item.id)"
            />
          </q-fab>
          <div class="row no-wrap items-center">
            <div class="col text-h6">
              {{ movies.find((x) => x.id === item.movie.id)?.title }} ({{
                movies.find((x) => x.id === item.movie.id)?.year
              }})
            </div>
          </div>

          <q-rating
            v-model="item.stars"
            :max="5"
            size="xs"
            @click="updateStars(item.stars, item.id)"
          />
          <div class="q-mt-sm">
            <span
              class="text-caption text-grey"
              @click="tmpDescription = item.desc"
            >
              {{ item.desc }}
            </span>
          </div>
          <q-input v-show="tmpDescription" outlined v-model="tmpDescription">
            <template v-slot:append>
              <q-icon
                class="cursor-pointer q-mr-xs"
                name="close"
                color="red"
                @click="tmpDescription = ''"
              />
              <q-icon
                class="cursor-pointer"
                name="check"
                color="positive"
                @click="updateDescription(item.id, item.desc)"
              /> </template
          ></q-input>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-chip
            v-for="friend of item.friends"
            :key="friend.id"
            removable
            @remove="removeUserFromView(item.id, friend)"
            >{{ users.find((user) => user.id === friend.id)?.nickname }}</q-chip
          >
          <q-btn-dropdown
            dropdown-icon="add_circle"
            size="sm"
            color="grey-6"
            flat
            rounded
            @click="handleViewFriends(item.friends)"
          >
            <q-list>
              <q-item clickable v-close-popup v-show="!listUsersToAdd.length">
                <q-item-section>
                  <q-item-label class="text-grey">No more users</q-item-label>
                </q-item-section>
              </q-item>
              <q-item
                clickable
                v-close-popup
                v-for="user in listUsersToAdd"
                :key="user.id"
                @click="addUserToView(item.id, user)"
              >
                <q-item-section>
                  <q-item-label>{{ user.name.split(" ")[0] }}</q-item-label>
                  <q-item-label caption>{{
                    user.email.split("@")[0]
                  }}</q-item-label>
                </q-item-section>
              </q-item></q-list
            >
          </q-btn-dropdown>
        </q-card-section>
      </q-card>
    </q-timeline-entry>
    <q-timeline-entry heading class="text-grey">2023</q-timeline-entry>
  </q-timeline>
  <div v-else class="text-center text-grey">
    <h5>There are no movies yet</h5>
    <h4>...</h4>
  </div>
</template>

<style scoped>
.my-card {
  width: 100%;
  max-width: 22vw;
}

@media only screen and (max-width: 600px) {
  .my-card {
    max-width: 60vw;
  }
}
@media only screen and (min-width: 600px) and (max-width: 1023px) {
  .my-card {
    max-width: 35vw;
  }
}
</style>
