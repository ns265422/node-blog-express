// 分頁製作
/*
    總共有幾頁 pageTotal
    目前在第幾頁 currentPage
    每頁有多少文章 perpage
    當前頁面資料
*/
const pageConfig = {
  perpage: 10, // 美個頁面放10篇文章，超過就換頁
};

const convertPagination = (snapshot, current, category = '') => {
  const data = [];
  const totalResult = snapshot.length; // 全部有幾篇文章
  const pageCount = Math.ceil(totalResult / pageConfig.perpage); // 總頁數
  let currentPage = current;
  let i = 0;
  if (currentPage > pageCount) {
    currentPage = pageCount;
  }

  const minItem = (currentPage * pageConfig.perpage) - pageConfig.perpage;
  const maxItem = currentPage * pageConfig.perpage;
  snapshot.forEach((childSnapshot) => {
    i += 1;
    if (i > minItem && i <= maxItem) {
      const item = childSnapshot;
      item.num = i;
      data.push(item);
    }
  });

  return {
    page: {
      total_pages: pageCount,
      current_page: currentPage,
      has_pre: currentPage > 1,
      has_next: currentPage < pageCount,
      category,
    },
    data,
  };
};

module.exports = convertPagination;
