'use strict';

var mail;
var user = { child: '' };

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
  return (
    firebase.auth().currentUser.photoURL || '/images/profile_placeholder.png'
  );
}

// Returns the signed-in user's display name.
function getUserName() {
  return firebase.auth().currentUser.displayName;
}

// Returns the signed-in user's email.
function getUserMail() {
  return firebase.auth().currentUser.email;
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
  if (user) {
    // User is signed in!
    // Get the signed-in user's profile pic and name.
    var profilePicUrl = getProfilePicUrl();
    var userName = getUserName();

    // Set the user's profile pic and name.
    userPicElement.style.backgroundImage =
      'url(' + addSizeToGoogleProfilePic(profilePicUrl) + ')';
    userNameElement.textContent = userName;

    // Show user's profile and sign-out button.
    userNameElement.removeAttribute('hidden');
    userPicElement.removeAttribute('hidden');
    signOutButtonElement.removeAttribute('hidden');

    // Hide sign-in button.
    signInButtonElement.setAttribute('hidden', 'true');
    mail = getUserMail();

    // We save the Firebase Messaging Device token and enable notifications.
    // saveMessagingDeviceToken();
  } else {
    // User is signed out!
    // Hide user's profile and sign-out button.
    userNameElement.setAttribute('hidden', 'true');
    userPicElement.setAttribute('hidden', 'true');
    signOutButtonElement.setAttribute('hidden', 'true');

    // Show sign-in button.
    signInButtonElement.removeAttribute('hidden');
  }
}

// Saves a new date on the Firebase DB.
function saveNote(dateText, weatherText, moodText) {
  // Add a new message entry to the database.
  return firebase
    .firestore()
    .collection('notes')
    .add({
      name: getUserName(),
      child: user.child,
      date: dateInputElement.value,
      weather: weatherInputElement.value,
      profilePicUrl: getProfilePicUrl(),
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      mood: moodInputElement.value,
      pickUpTime: pickUpTimeElement.value,
      //dateInputElement.value, weatherInputElement.value, moodInputElement.value
    })
    .catch(function (error) {
      console.error('Error writing new date to database', error);
    });
}

async function getPerson(mail) {
  console.log('getPerson-mail:' + mail);
  var query = firebase
    .firestore()
    .collection('persons')
    .where('mail', '==', mail);
  return query
    .get()
    .then((querySnapshot) => {
      if (querySnapshot.size > 1) {
        console.log('重複データが存在します');
        return 0;
      } else if (querySnapshot.empty) {
        console.log('データが見つかりませんでした');
        return 0;
      } else {
        console.log('getPerson-parents:' + querySnapshot.docs[0].id);
        return querySnapshot.docs[0].id;
      }
    })
    .catch((error) => {
      console.log('Error getting documents: ', error);
    });
}

/**
 * 子どものIDを取得する
 * @param {String} personId 親のID
 * @returns {String} 子どものID
 */
async function getFamily(personId) {
  var query = firebase
    .firestore()
    .collection('family')
    .where('parents', 'array-contains', personId);
  return query
    .get()
    .then((querySnapshot) => {
      // TODO: 兄弟なしの場合しか検討していない
      console.log('getFamily-personId:' + personId);
      console.log('getFamily-child:' + querySnapshot.docs[0].data().child);
      return querySnapshot.docs[0].data().child;
    })
    .catch((error) => {
      console.log('Error getting documents: ', error);
      console.log(personId);
    });
}

async function getNote(dateText, child) {
  var query = firebase
    .firestore()
    .collection('notes')
    .where('date', '==', dateText)
    .where('child', '==', child);
  return query.get().then((querySnapshot) => {
    if (!querySnapshot.empty) {
      querySnapshot.forEach((doc) => {
        // doc.data() is never undefined for query doc snapshots
        console.log(doc.id, ' => ', doc.data());
        // データの設定
        weatherInputElements[doc.data().weather].checked = true;
        moodInputElements[doc.data().mood].checked = true;
      });
    } else {
      // データがない場合は初期値に戻す
      weatherInputElements.forEach((element) => {
        element.checked = false;
      });
      moodInputElements.forEach((element) => {
        element.checked = false;
      });
    }
  });
}

async function searchDate(dateText) {
  getPerson(mail)
    .then((parent) => {
      // TODO: ログイン時に子供を聞くべきでここで聞いている場合ではない
      return getFamily(parent);
    })
    .then((child) => {
      user.child = child;
      return getNote(dateText, child);
    })
    .catch((error) => {
      console.error(error);
    });
}

// Triggered when the send new date form is submitted.
function onNoteFormSubmit(e) {
  e.preventDefault();
  // Check that the user entered a date and is signed in.
  if (dateInputElement.value && checkSignedInWithMessage()) {
    saveNote(
      dateInputElement.value,
      weatherInputElement.value,
      moodInputElement.value
    );
    // saveDate(dateInputElement.value).then(function () {
    //     // Clear message text field and re-enable the SEND button.
    //     resetMaterialTextfield(messageInputElement);
    //     toggleButton();
    // });
  }
}

new Vue({
  el: '#title_header',
  data: {
    title_header: '乳幼児れんらくノート',
  },
});

// Returns true if user is signed-in. Otherwise false and displays a message.
function checkSignedInWithMessage() {
  // Return true if the user is signed in Firebase
  if (isUserSignedIn()) {
    return true;
  }

  // Display a message to the user using a Toast.
  var data = {
    message: 'You must sign-in first',
    timeout: 2000,
  };
  signInSnackbarElement.MaterialSnackbar.showSnackbar(data);
  return false;
}

function changeDateInput(e) {
  console.log(dateInputElement.value);
  searchDate(dateInputElement.value).catch((error) => {
    console.error(error);
  });
}

function clickWeatherGroup(e) {
  weatherInputElement = document.querySelector(
    '[name="weather-radio"]:checked'
  );
}

function clickMoodGroup(e) {
  moodInputElement = document.querySelector('[name="mood-radio"]:checked');
}

function changeTime(e) {
  var timeElement = document.getElementById(e.target.id);
  // "時"と"分"に分ける
  var time = timeElement.value.split(':');
  // 15分単位に切り捨てする
  // 15分単位のみの時間を表示するようにブラウザが対応できないため切り捨てする対応にしている
  var minutes = Number(time[1]);
  if (minutes >= 0 && minutes <= 14) {
    time[1] = '00';
  } else if (minutes >= 15 && minutes <= 29) {
    time[1] = '15';
  } else if (minutes >= 30 && minutes <= 44) {
    time[1] = '30';
  } else {
    time[1] = '45';
  }
  // hh24:mmに戻す
  var newTime = time[0] + ':' + time[1];
  timeElement.value = newTime;
  // TODO: トーストで切り捨てられていることは表示する？
}

var count = 0;

function changeTemp(){
  count++;
  var time = sendTempTimeElement.value;
  var temp = sendTempTextElement.value;
  if (time > 0) {
    return false;
  }
  if (temp == '') {
    return false;
  }
  console.log(time + ',' + temp + ',' + count);
}

/**
 * 分の選択値の設定
 */
function setOptionValue() {
  if ('content' in document.createElement('template')) {
    console.log('対応しているよ');
    /**
     * @type {*}
     * @desc コピー先の親要素
     */
    const elements = document.querySelectorAll('select.minute');
    /**
     * @type {Element}
     * @desc コピー元の要素
     */
    const template = document.querySelector('#minuteOption');

    elements.forEach((element) => {
      /**
       * @type {HTMLTemplateElement}
       * @readonly
       * @desc コピー元から複製した内容. DOMには未反映.
       */
      const clone = template.content.cloneNode(true);
      element.appendChild(clone);
    });
    // 複製した内容の書き換え

    // バッヂの設定
  } else {
    console.log('対応してないよ');
  }
}

/**
 * 各行部品の設定
 */
function setTimeline() {
  if ('content' in document.createElement('template')) {
    console.log('対応しているよ');
    /**
     * @type {*}
     * @desc コピー先の親要素
     */
    const elements = document.querySelectorAll('.timeline_row');
    /**
     * @type {Element}
     * @desc コピー元の要素
     */
    const template = document.querySelector('#timelineItem');

    elements.forEach((element) => {
      const hour = element.dataset['hour'];
      /**
       * @type {HTMLTemplateElement}
       * @readonly
       * @desc コピー元から複製した内容. DOMには未反映.
       */
      const clone = template.content.cloneNode(true);
      // idにhhが含まれるものを置き換えてidの重複をなくす
      const texts = clone.querySelectorAll('[id*="hh"]');
      texts.forEach((text) => {
        text.id = text.id.replace('hh', hour);
      });
      element.appendChild(clone);
    });
    // 複製した内容の書き換え

    // バッヂの設定
  } else {
    console.log('対応してないよ');
  }
}

// Shortcuts to DOM Elements.
// var messageListElement = document.getElementById('messages');
var noteFormElement = document.getElementById('note-form');
var dateInputElement = document.getElementById('date');
var weatherGroupElement = document.getElementById('weather-group');
var weatherInputElements = document.getElementsByName('weather-radio');
var weatherInputElement;
var submitButtonElement = document.getElementById('submit');
var moodGroupElement = document.getElementById('mood-group');
var moodInputElements = document.getElementsByName('mood-radio');
var moodInputElement;
var pickUpTimeElement = document.getElementById('pickUpTime');
var sendTempTimeElement = document.getElementById('sendTempTime');
var sendTempElement = document.getElementById('sendTemp');
var sendTempTextElement = document.getElementById('sendTempText');
// var imageButtonElement = document.getElementById('submitImage');
// var imageFormElement = document.getElementById('image-form');
// var mediaCaptureElement = document.getElementById('mediaCapture');
var userPicElement = document.getElementById('user-pic');
var userNameElement = document.getElementById('user-name');
var signInButtonElement = document.getElementById('sign-in');
var signOutButtonElement = document.getElementById('sign-out');
var signInSnackbarElement = document.getElementById('must-signin-snackbar');

// 開発用
var test1Element = document.getElementById('test1');
var test2Element = document.getElementById('test2');
var test3Element = document.getElementById('test3');

noteFormElement.addEventListener('submit', onNoteFormSubmit);
signOutButtonElement.addEventListener('click', signOut);
signInButtonElement.addEventListener('click', signIn);
dateInputElement.addEventListener('change', changeDateInput);
weatherGroupElement.addEventListener('click', clickWeatherGroup);
moodGroupElement.addEventListener('click', clickMoodGroup);
pickUpTimeElement.addEventListener('change', changeTime);
sendTempTimeElement.addEventListener('change', changeTime);
sendTempElement.addEventListener('change', changeTemp, true);
sendTempTextElement.addEventListener('change', changeTemp, true);

document.addEventListener('DOMContentLoaded', function () {
  /**
   * アイコンクリックで要素を隠したり表示したりする
   * @param {*} e
   */
  function clickIcon(e) {
    var selectId = e.target.id;
    var selectElement = document.getElementById(selectId);
    var parentElement;
    if (selectId.indexOf('icon') > 0) {
      parentElement = selectElement.parentElement;
    } else {
      parentElement = selectElement.previousElementSibling;
    }
    var className = parentElement.className;
    if (className.indexOf('-off') > 0) {
      className = className.slice(0, -4);
    }
    parentElement.classList.toggle(className);
    parentElement.classList.toggle(className + '-off');
  }

  // 引数に指定したclassの値をもつ要素をすべて取得
  const elements = document.querySelectorAll(
    '.iconButton_upper, .iconButton_empty, .iconButton_text'
  );
  // 上記で取得したすべての要素に対してクリックイベントを適用
  for (let i = 0; i < elements.length; i++) {
    elements[i].addEventListener('click', clickIcon);
  }
});

// 開発用
// test1Element.addEventListener('click', clickTest1);
// test2Element.addEventListener('click', clickTest2);
// test3Element.addEventListener('click', clickTest3);

// initialize Firebase
initFirebaseAuth();
setTimeline();
setOptionValue();
