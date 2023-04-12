export type responseFromApi = Array<Movie>;
export type movieType = 1 | 2;

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

export interface MovieTree {
  tag: string;
  img?: string;
  id?: string;
  year?: number;
  label?: string;
  children: MovieTree[];
}
