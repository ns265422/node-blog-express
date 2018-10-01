// 文章排序，最新發表的文章放在第一筆
// 1. 先建立一個空陣列，把所有文章放進去，最新發表的文章會先排到最後面
// 2.然後使用 reverse()，將陣列前後翻轉 [1,2,3,4,5] -> [5,4,3,2,1]
const firebaseSort = {
  byDate(snapshot, key, value) {
    const sortData = [];
    snapshot.forEach((childSnapshot) => {
      const child = childSnapshot.val();
      if (child[key] === value) {
        sortData.push(child);
      }
    });
    sortData.reverse(); //
    return sortData;
  },
};

module.exports = firebaseSort;
