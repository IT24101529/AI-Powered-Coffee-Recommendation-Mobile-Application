const DEV_URL = 'http://192.168.x.x:5000';
const PROD_URL = 'https://ember-coffee-api.onrender.com';

export const BASE_URL = __DEV__ ? DEV_URL : PROD_URL;
