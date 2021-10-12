class Person {
  /**
   *
   * @param {String} mail
   * @param {String} firstName
   * @param {String} familyName
   */
  constructor(mail, firstName, familyName) {
    this.mail = mail;
    this.firstName = firstName;
    this.familyName = familyName;
  }

  /**
   *
   * @return {String} id
   */
  async getPerson() {
    console.log('getPerson-mail:' + this.mail);
    var query = firebase
      .firestore()
      .collection('persons')
      .where('mail', '==', this.mail);
    return query
      .get()
      .then((querySnapshot) => {
        if (querySnapshot.size > 1) {
          console.log('重複データが存在します');
          return 2;
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
