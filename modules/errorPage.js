// 亂輸入網址，render() 錯誤頁面的訊息給使用者
module.exports = (res, title) => {
  res.render('error.ejs', {
    title,
  });
};
