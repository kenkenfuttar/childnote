import { Parent } from './parent.js';
('use strict');

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
function saveNote() {
  // Add a new message entry to the database.
  return firebase
    .firestore()
    .collection('notes')
    .add({
      name: getUserName(),
      child: user.child,
      date: dateInputElement.value,
      weather: getRadioInput(weatherInputElements),
      profilePicUrl: getProfilePicUrl(),
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      mood: getRadioInput(moodInputElements),
      pickUpTime: pickUpTimeElement.value,
    })
    .catch(function (error) {
      console.error('Error writing new date to database', error);
    });
}

/**
 *
 * @param {String} dateText
 * @param {String} child
 * @returns
 */
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

/**
 * 日付から連絡ノートの内容を表示する
 * @param {String} dateText
 */
async function searchDate(dateText) {
  parent
    .getPerson()
    .then((parentId) => {
      // TODO: ログイン時に子供を聞くべきでここで聞いている場合ではない
      return parent.getFamily(parentId);
    })
    .then((child) => {
      user.child = child;
      return getNote(dateText, child);
    })
    .catch((error) => {
      console.error(error);
    });
  // user.child = parent.childId;
  // return getNote(dateText, parent.childId);
}

/**
 *
 * @returns {boolean} timeline上に検温のデータがあればtrue
 */
function setTempOnTimeline() {
  var time = sendTempTimeElement.value.split(':');
  var existTemp = document.querySelector(
    '.timeline_row .timeline_temperature .iconButton_item .iconButton_text'
  );
  if (existTemp != null) {
    console.log('設定済みの検温があるためエラー');
    return false;
  }
  var timelineRow = document.querySelector(
    '.timeline_row[data-hour="' + time[0] + '"]'
  );
  var temp = timelineRow.querySelector(
    '.timeline_temperature > .iconButton_item-off'
  );
  temp.classList.toggle('iconButton_item-off');
  temp.classList.toggle('iconButton_item');
  var tempTime = temp.querySelector('.minute');
  tempTime.value = time[1];
  var tempText = temp.querySelector('.iconButton_text');
  tempText.value = sendTempTextElement.value;
  return true;
}

// Triggered when the send new date form is submitted.
function onNoteFormSubmit(e) {
  e.preventDefault();
  // Check that the user entered a date and is signed in.
  // TODO: 必須情報のバリデーションでチェックする

  // timelineの検温にデータが存在しないならばtimeline上への検温の反映を行う。
  if (!setTempOnTimeline()) {
    // 存在する場合処理を保存処理を中断
    return;
  }

  if (dateInputElement.value && checkSignedInWithMessage()) {
    saveNote();
    // saveDate(dateInputElement.value).then(function () {
    //     // Clear message text field and re-enable the SEND button.
    //     resetMaterialTextfield(messageInputElement);
    //     toggleButton();
    // });
  }
}

new Vue({
  el: '#title_header',
  data() {
    return {
      title_header: '乳幼児れんらくノート',
    };
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

/**
 *
 * @param {NodeListOf<HTMLElement>} elements ラジオボタングループ
 * @return {String} 選択されたラジオボタンの値
 */
function getRadioInput(elements) {
  var retValue = null;
  elements.forEach((element) => {
    if (element.checked) {
      retValue = element.value;
    }
  });
  return retValue;
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

/**
 * 分の選択値の設定
 */
function setOptionValue() {
  if ('content' in document.createElement('template')) {
    console.log('対応しているよ' + 'setOptionValue');
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
    console.log('対応しているよ' + 'setTimeline');
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

    // バッヂの設定
  } else {
    console.log('対応してないよ');
  }
}

function clickCover(e) {
  // 背景を表示する
  coverElement.removeAttribute('class');
  coverElement.setAttribute('class', 'cover-hide');
  // スクロールさせないようにする
  document.body.removeAttribute('class');
}

// Shortcuts to DOM Elements.
// var messageListElement = document.getElementById('messages');
var noteFormElement = document.getElementById('note-form');
var dateInputElement = document.getElementById('date');
var weatherInputElements = document.getElementsByName('weather-radio');
var moodInputElements = document.getElementsByName('mood-radio');
var pickUpTimeElement = document.getElementById('pickUpTime');
var sendTempTimeElement = document.getElementById('sendTempTime');
var sendTempTextElement = document.getElementById('sendTempText');
// var imageButtonElement = document.getElementById('submitImage');
// var imageFormElement = document.getElementById('image-form');
// var mediaCaptureElement = document.getElementById('mediaCapture');
var userPicElement = document.getElementById('user-pic');
var userNameElement = document.getElementById('user-name');
var signInButtonElement = document.getElementById('sign-in');
var signOutButtonElement = document.getElementById('sign-out');
var signInSnackbarElement = document.getElementById('must-signin-snackbar');
var coverElement = document.getElementById('cover');

// 開発用
var test1Element = document.getElementById('test1');
var test2Element = document.getElementById('test2');
var test3Element = document.getElementById('test3');

noteFormElement.addEventListener('submit', onNoteFormSubmit);
signOutButtonElement.addEventListener('click', signOut);
signInButtonElement.addEventListener('click', signIn);
dateInputElement.addEventListener('change', changeDateInput);
pickUpTimeElement.addEventListener('change', changeTime);
sendTempTimeElement.addEventListener('change', changeTime);
coverElement.addEventListener('click', clickCover);

document.addEventListener('DOMContentLoaded', function () {
  /**
   * アイコンクリックで要素を隠したり表示したりする
   * @param {*} e
   */
  function clickIcon(e) {
    var selectId = e.target.id;
    var selectElement = document.getElementById(selectId);
    var parentElement;

    // どこを起点とするか
    if (selectId.indexOf('icon') > 0) {
      parentElement = selectElement.parentElement;
    } else {
      parentElement = selectElement.previousElementSibling;
    }

    var className = parentElement.className;
    // class名の設定、-offがついてれば外して考える
    if (className.indexOf('-off') > 0) {
      className = className.slice(0, -4);
    }
    parentElement.classList.toggle(className);
    parentElement.classList.toggle(className + '-off');
    // 背景を隠す
    coverElement.removeAttribute('class');
    coverElement.setAttribute('class', 'cover-show');
    // スクロールさせないようにする
    document.body.setAttribute('class', 'scroll-lock');
    document.getElementById('cover_title').innerHTML =
      '{{title_time}}時{{title_action}}';
    new Vue({
      el: '#cover_title',
      data() {
        return {
          title_time: parentElement.id.slice(-2),
          title_action: parentElement.id.slice(0, 4),
        };
      },
    });
  }

  /**
   * アイコンクリックで要素を隠したり表示したりする
   * @param {*} e
   */
  function clickIconSleep(e) {
    console.log('睡眠用だよ');
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
      parentElement.classList.toggle(className + '-begin');
      parentElement.classList.toggle(className + '-off');
      parentElement.firstElementChild.value = 'star';
    } else if (className.indexOf('-begin') > 0) {
      className = className.slice(0, -6);
      parentElement.classList.toggle(className + '-end');
      parentElement.classList.toggle(className + '-begin');
      parentElement.firstElementChild.value = 'star_outline';
    } else {
      className = className.slice(0, -4);
      parentElement.classList.toggle(className + '-off');
      parentElement.classList.toggle(className + '-end');
    }
  }

  // 引数に指定したclassの値をもつ要素をすべて取得
  var elements = document.querySelectorAll(
    '.iconButton_upper, .iconButton_empty, .iconButton_text'
  );
  // 上記で取得したすべての要素に対してクリックイベントを適用
  elements.forEach((element) => {
    if (element.getAttribute('type') == 'text') {
      element.addEventListener('dblclick', clickIcon);
    } else if (element.id.slice(0, 5) == 'sleep') {
      // 睡眠の場合
      element.addEventListener('click', clickIconSleep);
    } else {
      // 睡眠以外の場合
      element.addEventListener('click', clickIcon);
    }
  });
});

// 開発用
// test1Element.addEventListener('click', clickTest1);
// test2Element.addEventListener('click', clickTest2);
// test3Element.addEventListener('click', clickTest3);

// initialize Firebase
initFirebaseAuth();
var parent = new Parent('who.is.this.king.of.glory@gmail.com', '健太', '二橋');
setTimeline();
setOptionValue();
