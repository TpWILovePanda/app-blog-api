const convertPagination = function (articles, currentPage) {
  const totalResult = articles.length;
  const prepage = 3; // 每頁 3 筆資料
  const pageTotal = Math.ceil(totalResult / prepage); // 總頁數, Math.ceil(): 無條件進位
  const data = [];
  // const currentPage = 2; // 當前頁數
  if (currentPage > pageTotal) {
    currentPage = pageTotal;
  }
  const minItem = (currentPage * prepage) - prepage + 1; // 4
  const maxItem = (currentPage * prepage); // 6
  // 使用結果反推公式
  // console.log('總資料', totalResult, '每頁數量', prepage, '總頁數', pageTotal, '每頁第一筆', minItem, '每頁最後一筆', maxItem);
  articles.forEach((item, index) => {
    let itemNum = index + 1;
    if (minItem <= itemNum && itemNum <= maxItem) {
      // console.log(item.title, index);
      data.push(item);
    }
  });
  const hasPre = currentPage > 1;
  const hasNext = currentPage < pageTotal;
  page = {
    currentPage,
    hasPre,
    hasNext,
    pageTotal,
  };
  
  return {
    data,
    page,
  };
};

module.exports = convertPagination;
