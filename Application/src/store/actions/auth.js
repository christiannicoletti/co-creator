import * as actionTypes from "./actionTypes";
import axios from "axios";

/*
 *   Only information used for authentication:
 *   email
 *   password
 */

export const authStart = () => {
  return {
    type: actionTypes.AUTH_START
  };
};

export const authSuccess = (token, userId) => {
  return {
    type: actionTypes.AUTH_SUCCESS,
    idToken: token,
    userId: userId
  };
};

export const authFail = error => {
  return {
    type: actionTypes.AUTH_FAIL,
    error: error
  };
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("expirationDate");
  localStorage.removeItem("userId");
  localStorage.removeItem("name");
  localStorage.removeItem("photoURL");
  localStorage.removeItem("userId");
  localStorage.removeItem("email");
  localStorage.removeItem("username");
  localStorage.removeItem("publicuserinfoname");
  localStorage.removeItem("publicuserinfophoto");
  localStorage.removeItem("publicuserinfousername");
  localStorage.removeItem("publicuserinfoworkBiography");
  localStorage.removeItem("publicuserinfoprojectPositions");
  localStorage.removeItem("publicuserinfosubjectExperience");
  localStorage.removeItem("publicuserinfosubjectTags");
  return {
    type: actionTypes.AUTH_LOGOUT
  };
};

export const checkAuthTimeout = expirationTime => {
  return dispatch => {
    setTimeout(() => {
      dispatch(logout());
    }, expirationTime * 1000);
  };
};

export const authSignup = (name, email, displayName, password) => {
  return async dispatch => {
    dispatch(authStart());
    const authData = {
      name: name,
      email: email,
      displayName: displayName,
      password: password,
      returnSecureToken: true
    };
    let url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${process.env.REACT_APP_API_KEY}`;

    try {
      console.log("Authenticating email/password");
      const res = await axios.post(url, authData);
      console.log("Authenticated email/password!");
      const expirationData = new Date(
        new Date().getTime() + res.data.expiresIn * 1000
      );
      const uid = res.data.localId;
      localStorage.setItem("token", res.data.idToken);
      localStorage.setItem("expirationDate", expirationData);
      localStorage.setItem("userId", res.data.localId);

      console.log("Storing user...");
      let url_store = `https://us-central1-co-creator-144ca.cloudfunctions.net/addPrivateandPublicUser`;
      const userData = {
        uid: uid,
        name: name,
        email: email,
        photoURL: "gfdsg",
        username: displayName,
        workBiography: null,
        projectPositions: null,
        subjectExperience: null,
        subjectTags: null
      };
      const user = await axios.post(url_store, userData);
      localStorage.setItem("name", name);
      localStorage.setItem("photoURL", "");
      localStorage.setItem("username", displayName);
      console.log("Private user information stored: ", user);

      dispatch(authSuccess(res.data.idToken, res.data.localId));
      dispatch(checkAuthTimeout(res.data.expiresIn));
    } catch (err) {
      dispatch(authFail(err));
    }
  };
};

export const authSignin = (email, password) => {
  return async dispatch => {
    dispatch(authStart());
    const authData = {
      email: email,
      password: password,
      returnSecureToken: true
    };
    let url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.REACT_APP_API_KEY}`;
    try {
      console.log("Authenticating email/password");
      const res = await axios.post(url, authData);
      console.log("Authenticated email/password!");
      const expirationData = new Date(
        new Date().getTime() + res.data.expiresIn * 1000
      );
      const uid = res.data.localId;
      localStorage.setItem("token", res.data.idToken);
      localStorage.setItem("expirationDate", expirationData);
      localStorage.setItem("userId", res.data.localId);

      console.log("Retrieving user...");
      let url_retrieve = `https://us-central1-co-creator-144ca.cloudfunctions.net/getPrivateUser`;
      const user = {
        uid: uid
      };
      const userData = await axios.post(url_retrieve, user);
      localStorage.setItem("name", userData.data.name);
      localStorage.setItem("email", userData.data.email);
      localStorage.setItem("username", userData.data.username);
      console.log("Private user data retrieved: ", userData.data);

      dispatch(authSuccess(res.data.idToken, res.data.localId));
      dispatch(checkAuthTimeout(res.data.expiresIn));
    } catch (err) {
      dispatch(authFail(err));
    }
  };
};

export const setAuthRedirectPath = path => {
  return {
    type: actionTypes.SET_AUTH_REDIRECT_PATH,
    path: path
  };
};

export const authCheckState = () => {
  return dispatch => {
    const token = localStorage.getItem("token");
    if (!token) {
      dispatch(logout());
    } else {
      const expirationDate = new Date(localStorage.getItem("expirationDate"));
      if (expirationDate <= new Date()) {
        dispatch(logout());
      } else {
        const userId = localStorage.getItem("userId");
        dispatch(authSuccess(token, userId));
        dispatch(
          checkAuthTimeout(
            (expirationDate.getTime() - new Date().getTime()) / 1000
          )
        );
      }
    }
  };
};
