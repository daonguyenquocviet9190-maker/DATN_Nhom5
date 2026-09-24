const storeLocal = {};
const storeSession = {};
const makeStorage = (target) => ({
  getItem: (k) => Object.prototype.hasOwnProperty.call(target, k) ? target[k] : null,
  setItem: (k, v) => { target[k] = String(v); },
  removeItem: (k) => { delete target[k]; },
});

globalThis.window = {
  localStorage: makeStorage(storeLocal),
  sessionStorage: makeStorage(storeSession),
  dispatchEvent() {},
  addEventListener() {},
  removeEventListener() {},
  scrollTo() {},
};

globalThis.document = {
  addEventListener() {},
  removeEventListener() {},
};

const { logoutUser, getCurrentUser, getAuthToken } = await import('./utils/shopStorage.js');

storeLocal['dynova_current_user'] = JSON.stringify({ id: 1, fullName: 'Test User' });
storeSession['current_user'] = JSON.stringify({ id: 2, fullName: 'Session User' });
storeLocal['dynova_auth_token'] = 'abc';
storeSession['token'] = 'session-token';
storeLocal['isLoggedIn'] = 'true';

logoutUser();

console.log('local dynova_current_user:', storeLocal['dynova_current_user']);
console.log('session current_user:', storeSession['current_user']);
console.log('local auth token:', storeLocal['dynova_auth_token']);
console.log('session token:', storeSession['token']);
console.log('currentUser:', getCurrentUser());
console.log('authToken:', getAuthToken());
