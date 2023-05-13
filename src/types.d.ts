type movieType = 1 | 2;

export type responseFromApi = Array<Movie>;

export interface Label {
  label: string;
}

export interface Movie extends Label {
  id: string;
  title: string;
  year: number;
  img: string;
  type: movieType;
}

export interface User extends Label {
  id: string;
  name: string;
  email: string;
  nickname: string;
}

export interface View {
  id: string;
  movie: Movie;
  date: string;
  stars: number;
  friends: User[];
  desc: string;
  media: number;
}

export interface FormAddView {
  movie: Movie;
  date: string;
  stars: number;
  friends: User[];
  desc: string;
  media: number;
}

export interface Search {
  title: string;
  viewDate: string;
  viewYear: number;
  year: number;
  media: string[];
  movieYear: number;
}

export interface TreeMovies {
  letter: string;
  data: TreeMovie[];
}

export interface TreeMovie {
  label?: string;
  title: string;
  img: string;
  id?: string;
  year?: number;
  children?: Seasson[];
}

interface Seasson {
  seasson: number;
  children: Episode[];
}

interface Episode {
  episode: number;
  title: string;
  label: string;
  id: string;
  year: number;
}
