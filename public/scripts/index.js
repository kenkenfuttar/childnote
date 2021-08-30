'use strict';

// Signs-in
function signIn() {
    // Sign into Firebase using popup auth & Google as the identity provider.
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider);
}

// Signs-out
function signOut() {
    // Sign out of Firebase.
    firebase.auth().signOut();
}

// Initiate firebase auth.
function initFirebaseAuth() {
    // Listen to auth state changes.
    firebase.auth().onAuthStateChanged(authStateObserver);
}

// Returns the signed-in user's profile Pic URL.
function getProfilePicUrl() {
    return firebase.auth().currentUser.photoURL || '/images/profile_placeholder.png';
}

// Returns the signed-in user's display name.
function getUserName() {
    return firebase.auth().currentUser.displayName;
}

// Returns true if a user is signed-in.
function isUserSignedIn() {
    return !!firebase.auth().currentUser;
}

function addSizeToGoogleProfilePic(url) {
    if (url.indexOf('googleusercontent.com') !== -1 && url.indexOf('?') === -1) {
        return url + '?sz=150';
    }
    return url;
}

// Triggers when the auth state change for instance when the user signs-in or signs-out.
function authStateObserver(user) {
    if (user) { // User is signed in!
        // Get the signed-in user's profile pic and name.
        var profilePicUrl = getProfilePicUrl();
        var userName = getUserName();

        // Set the user's profile pic and name.
        userPicElement.style.backgroundImage = 'url(' + addSizeToGoogleProfilePic(profilePicUrl) + ')';
        userNameElement.textContent = userName;

        // Show user's profile and sign-out button.
        userNameElement.removeAttribute('hidden');
        userPicElement.removeAttribute('hidden');
        signOutButtonElement.removeAttribute('hidden');

        // Hide sign-in button.
        signInButtonElement.setAttribute('hidden', 'true');

        // We save the Firebase Messaging Device token and enable notifications.
        // saveMessagingDeviceToken();
    } else { // User is signed out!
        // Hide user's profile and sign-out button.
        userNameElement.setAttribute('hidden', 'true');
        userPicElement.setAttribute('hidden', 'true');
        signOutButtonElement.setAttribute('hidden', 'true');

        // Show sign-in button.
        signInButtonElement.removeAttribute('hidden');
    }
}

// Saves a new date on the Firebase DB.
function saveDate(dateText) {
    // Add a new message entry to the database.
    return firebase.firestore().collection('date').add({
        name: getUserName(),
        date: dateText,
        profilePicUrl: getProfilePicUrl(),
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(function (error) {
        console.error('Error writing new date to database', error);
    });
}

// Triggered when the send new date form is submitted.
function onDateFormSubmit(e) {
    e.preventDefault();
    // Check that the user entered a date and is signed in.
    if (dateInputElement.value && checkSignedInWithMessage()) {
        saveDate(dateInputElement.value);
        // saveDate(dateInputElement.value).then(function () {
        //     // Clear message text field and re-enable the SEND button.
        //     resetMaterialTextfield(messageInputElement);
        //     toggleButton();
        // });
    }
}

const titleHeader = new Vue({
    el: '#title__header',
    data: {
        title__header: '乳幼児れんらくノート',
    },
});

/**
 * @method header
 */
function header() {
    const btnHamburger = document.getElementById('btnNavbarToggle');
    const navbarNav2 = document.getElementById('navbarNav2');
    const navlinks = document.querySelectorAll('#navbarNav2 a');

    btnHamburger.addEventListener('click', () => {
        navbarNav2.classList.toggle('navbar__collapse--open');
        navbarNav2.classList.toggle('navbar__collapse');
        console.log(navbarNav2);
        navlinks.forEach((navlink) => {
            console.log(navlink);
            navlink.classList.toggle('nav__link--open');
            navlink.classList.toggle('nav__link');
        });
    });
}
header();

/**
 * @method resizeWindow
 */
function resizeWindow() {
    const navbarNav2 = document.getElementById('navbarNav2');
    const navlinks = document.querySelectorAll('#navbarNav2 a');
    if (navbarNav2.className == 'navbar__collapse--open') {
        navbarNav2.classList.replace(
            'navbar__collapse--open',
            'navbar__collapse',
        );
        console.log(navbarNav2);
        navlinks.forEach((navlink) => {
            console.log(navlink);
            navlink.classList.replace('nav__link--open', 'nav__link');
        });
    }
}

window.onresize = resizeWindow;

// Returns true if user is signed-in. Otherwise false and displays a message.
function checkSignedInWithMessage() {
    // Return true if the user is signed in Firebase
    if (isUserSignedIn()) {
        return true;
    }

    // Display a message to the user using a Toast.
    var data = {
        message: 'You must sign-in first',
        timeout: 2000
    };
    signInSnackbarElement.MaterialSnackbar.showSnackbar(data);
    return false;
}

// Shortcuts to DOM Elements.
// var messageListElement = document.getElementById('messages');
var dateFormElement = document.getElementById('date-form');
var dateInputElement = document.getElementById('date');
var submitButtonElement = document.getElementById('submit');
// var imageButtonElement = document.getElementById('submitImage');
// var imageFormElement = document.getElementById('image-form');
// var mediaCaptureElement = document.getElementById('mediaCapture');
var userPicElement = document.getElementById('user-pic');
var userNameElement = document.getElementById('user-name');
var signInButtonElement = document.getElementById('sign-in');
var signOutButtonElement = document.getElementById('sign-out');
var signInSnackbarElement = document.getElementById('must-signin-snackbar');

dateFormElement.addEventListener('submit', onDateFormSubmit);
signOutButtonElement.addEventListener('click', signOut);
signInButtonElement.addEventListener('click', signIn);

// initialize Firebase
initFirebaseAuth();