export const API_URI = process.env.REACT_APP_API_URL
// export const API_URI = 'https://mbret-oboku-api.glitch.me/'
// export const API_URI = 'https://tough-walrus-50.loca.lt/'

console.log(process.env)


export const ROUTES = {
  HOME: '/',
  BOOK_DETAILS: '/book/:id',
  SERIES_DETAILS: '/series/:id',
  SETTINGS: '/settings',
  LIBRARY_ROOT: '/library',
  LIBRARY_BOOKS: '/library/books',
  LIBRARY_SERIES: '/library/series',
  LIBRARY_TAGS: '/library/tags',
  LOGIN: '/login',
  REGISTER: '/register',
  READER: '/reader/:id'
}