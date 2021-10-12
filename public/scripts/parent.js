import { Person } from './person.js';

class Parent extends Person {
  /**
   *
   * @param {String} mail
   * @param {String} firstName
   * @param {String} familyName
   */
  constructor(mail, firstName, familyName) {
    super(mail, firstName, familyName);
    this.childId = this.getPerson().then((parentId) => {
      return this.getFamily(parentId);
    });
  }

  /**
   * Personクラスから継承
   * @return {String} id
   */
  async getPerson() {
    return super.getPerson();
  }

  /**
   * 子どものIDを取得する
   * @param {String} personId 親のID
   * @return {String} 子どものID
   */
  async getFamily(personId) {
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
}

export { Parent };
