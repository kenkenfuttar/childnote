class Person {
  constructor(mail, firstName, familyName) {
    this.mail = mail;
    this.firstName = firstName;
    this.familyName = familyName;
  }

  /**
   *
   * @param {String} mail 個人のアドレス
   * @return {String} id
   */
  async getPerson(mail) {
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
}

export { Person };
