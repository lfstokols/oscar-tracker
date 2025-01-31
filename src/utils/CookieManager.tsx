import Cookies from 'js-cookie';
import {COOKIE_NULL_VALUE, EXPIRATION_DAYS} from '../config/GlobalConstants';

export function getUsernameFromCookie() {
  const username = Cookies.get('activeUsername');
  return username === COOKIE_NULL_VALUE ? null : username;
}

export function getUserIdFromCookie() {
  const userId = Cookies.get('activeUserId');
  return userId === COOKIE_NULL_VALUE ? null : userId;
}

export function setUserIdCookie(userId: string | null) {
  Cookies.set('activeUserId', userId ?? COOKIE_NULL_VALUE, {
    expires: EXPIRATION_DAYS,
  });
}

export function setUsernameCookie(username: string | null) {
  Cookies.set('activeUsername', username ?? COOKIE_NULL_VALUE, {
    expires: EXPIRATION_DAYS,
  });
}

export function clearCookies() {
  Cookies.set('activeUserId', COOKIE_NULL_VALUE);
  Cookies.set('activeUsername', COOKIE_NULL_VALUE);
}
