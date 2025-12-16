// tasks/fiveMinuteTasks.js
const axios = require("axios");
const moment = require("moment");
const cheerio = require("cheerio");
const queryMySQL = require("../../utils/queryMySQL");

async function getNewsAll() {
  console.log("[getNewsAll] Executed");
  let listPost = [];
  const getListPost = async (sourceUrl) => {
    const response = await axios.get(sourceUrl);
    const html = response.data;
    const $ = cheerio.load(html);

    //   let listPost = [];
    let promises = [];

    try {
      switch (sourceUrl) {
        case "https://doisongphapluat.com.vn/kinh-doanh-17.html":
          $("article").each((index, element) => {
            // Lấy title từ thẻ a trong phần tiêu đề của bài viết
            let title = $(element)
              .find(".title , .ti2, a")
              .attr("title")
              .trim();

            // Kiểm tra xem tiêu đề có chứa cụm từ "Lãi suất ngân hàng hôm nay" không
            if (title.includes("Lãi suất ngân hàng hôm nay")) {
              // Lấy URL của bài viết
              let url = $(element).find("a").attr("href").trim();
              let date = moment().format("DD-MM-YYYY");
              let time = `${date} 07:16`;
              let image = $(element).find("img").attr("data-src");
              if (!image) {
                // Nếu `data-src` không tồn tại, dùng thuộc tính `src`
                image = $(element).find("img").attr("src");
              }

              // Xóa bỏ hình ảnh base64 tạm thời nếu có
              if (image && image.startsWith("data:image")) {
                image = null;
              }

              // Nếu có ảnh, trim để xóa các khoảng trắng
              if (image) {
                image = image.trim();
              }

              let description = $(element).find("p").text().trim();
              let type = "Lãi suất";

              listPost.push({
                title,
                url,
                image,
                time,
                description,
                type,
              });
            }
          });
          break;
        case "https://www.qdnd.vn/kinh-te/tin-tuc":
          $(".list-news-category article").each((index, element) => {
            // Lấy title từ thẻ h3 > a
            let title = $(element).find("h3 a").attr("title").trim();

            // Kiểm tra xem tiêu đề có chứa cụm từ "Giá vàng hôm nay" không
            if (title.includes("Giá vàng hôm nay")) {
              // Lấy URL từ thuộc tính href của thẻ a
              let url = $(element).find("h3 a").attr("href").trim();

              // Lấy image URL từ thẻ img trong div.article-thumbnail
              let image = $(element)
                .find(".article-thumbnail img")
                .attr("src")
                .trim();

              // Lấy description từ thẻ p đầu tiên có class hidden-xs (thường là mô tả)
              let description = $(element)
                .find("p.hidden-xs")
                .not(".pubdate")
                .text()
                .trim();
              let type = "Vàng";
              // Lấy thời gian từ thẻ p với class pubdate
              let time = $(element).find("p.pubdate").text().trim();

              // Kiểm tra nếu đầy đủ thông tin thì thêm vào mảng listPost
              if (title && url && image && description && time) {
                listPost.push({
                  title,
                  url,
                  image,
                  time,
                  description,
                  type,
                });
              }
            }
          });

          break;

        case "https://doanhnhanvn.vn/dau-tu/chung-khoan":
          $(".zone__content > article").each((index, element) => {
            promises.push(
              new Promise(async (resolve) => {
                // Lấy tiêu đề bài viết
                let title = $(element).find("h3.story__title a").text().trim();

                // Lấy URL của bài viết
                let url = $(element).find("h3.story__title a").attr("href");

                // Lấy ảnh đại diện của bài viết
                let image = $(element)
                  .find("figure.story__thumb img")
                  .attr("src");

                // Lấy thời gian đăng bài viết
                // let time = $(element)
                //   .find("div.story__meta time")
                //   .text()
                //   .trim();
                // Lấy thời gian đăng bài viết
                let timeElement = $(element)
                  .find("div.story__meta time")
                  .text()
                  .trim();
                // Loại bỏ dấu | và các khoảng trắng xung quanh nó
                let cleanedTime = timeElement.replace(/\s*\|\s*/, " ");
                // Định dạng lại thời gian
                let time = moment(cleanedTime, "HH:mm DD/MM/YYYY").format(
                  "DD/MM/YYYY HH:mm"
                );

                // Lấy mô tả bài viết
                let description = $(element)
                  .find("div.story__summary")
                  .text()
                  .trim();
                let type = "Chứng khoán";
                // Kiểm tra nếu tất cả các dữ liệu hợp lệ thì push vào listPost
                if (title && url && image && time && description) {
                  listPost.push({
                    title,
                    url,
                    image,
                    time,
                    description,
                    type,
                  });
                }

                // Resolve promise sau khi hoàn tất
                resolve();
              })
            );
          });

          break;
        case "https://doanhnhanvn.vn/dau-tu/bat-dong-san":
          $(".zone__content > article").each((index, element) => {
            promises.push(
              new Promise(async (resolve) => {
                // Lấy tiêu đề bài viết
                let title = $(element).find("h3.story__title a").text().trim();

                // Lấy URL của bài viết
                let url = $(element).find("h3.story__title a").attr("href");

                // Lấy ảnh đại diện của bài viết
                let image = $(element)
                  .find("figure.story__thumb img")
                  .attr("src");

                // Lấy thời gian đăng bài viết
                let timeElement = $(element)
                  .find("div.story__meta time")
                  .text()
                  .trim();
                // Loại bỏ dấu | và các khoảng trắng xung quanh nó
                let cleanedTime = timeElement.replace(/\s*\|\s*/, " ");
                // Định dạng lại thời gian
                let time = moment(cleanedTime, "HH:mm DD/MM/YYYY").format(
                  "DD/MM/YYYY HH:mm"
                );

                // Lấy mô tả bài viết
                let description = $(element)
                  .find("div.story__summary")
                  .text()
                  .trim();
                let type = "Bất động sản";
                // Kiểm tra nếu tất cả các dữ liệu hợp lệ thì push vào listPost
                if (title && url && image && time && description) {
                  listPost.push({
                    title,
                    url,
                    image,
                    time,
                    description,
                    type,
                  });
                }

                // Resolve promise sau khi hoàn tất
                resolve();
              })
            );
          });

          break;
        case "https://doanhnhanvn.vn/doanh-nghiep/chuyen-dong":
          $(".zone__content > article").each((index, element) => {
            promises.push(
              new Promise(async (resolve) => {
                // Lấy tiêu đề bài viết
                let title = $(element).find("h3.story__title a").text().trim();

                // Lấy URL của bài viết
                let url = $(element).find("h3.story__title a").attr("href");

                // Lấy ảnh đại diện của bài viết
                let image = $(element)
                  .find("figure.story__thumb img")
                  .attr("src");

                // Lấy thời gian đăng bài viết
                let timeElement = $(element)
                  .find("div.story__meta time")
                  .text()
                  .trim();
                // Loại bỏ dấu | và các khoảng trắng xung quanh nó
                let cleanedTime = timeElement.replace(/\s*\|\s*/, " ");
                // Định dạng lại thời gian
                let time = moment(cleanedTime, "HH:mm DD/MM/YYYY").format(
                  "DD/MM/YYYY HH:mm"
                );

                // Lấy mô tả bài viết
                let description = $(element)
                  .find("div.story__summary")
                  .text()
                  .trim();
                let type = "Doanh nhân";
                // Kiểm tra nếu tất cả các dữ liệu hợp lệ thì push vào listPost
                if (title && url && image && time && description) {
                  listPost.push({
                    title,
                    url,
                    image,
                    time,
                    description,
                    type,
                  });
                }

                // Resolve promise sau khi hoàn tất
                resolve();
              })
            );
          });

          break;
        case "https://doanhnhanvn.vn/doanh-nghiep/m-a":
          $(".zone__content > article").each((index, element) => {
            promises.push(
              new Promise(async (resolve) => {
                // Lấy tiêu đề bài viết
                let title = $(element).find("h3.story__title a").text().trim();

                // Lấy URL của bài viết
                let url = $(element).find("h3.story__title a").attr("href");

                // Lấy ảnh đại diện của bài viết
                let image = $(element)
                  .find("figure.story__thumb img")
                  .attr("src");

                // Lấy thời gian đăng bài viết
                let timeElement = $(element)
                  .find("div.story__meta time")
                  .text()
                  .trim();
                // Loại bỏ dấu | và các khoảng trắng xung quanh nó
                let cleanedTime = timeElement.replace(/\s*\|\s*/, " ");
                // Định dạng lại thời gian
                let time = moment(cleanedTime, "HH:mm DD/MM/YYYY").format(
                  "DD/MM/YYYY HH:mm"
                );

                // Lấy mô tả bài viết
                let description = $(element)
                  .find("div.story__summary")
                  .text()
                  .trim();
                let type = "Doanh nhân";
                // Kiểm tra nếu tất cả các dữ liệu hợp lệ thì push vào listPost
                if (title && url && image && time && description) {
                  listPost.push({
                    title,
                    url,
                    image,
                    time,
                    description,
                    type,
                  });
                }

                // Resolve promise sau khi hoàn tất
                resolve();
              })
            );
          });

          break;
        case "https://doanhnhanvn.vn/doanh-nghiep/phat-trien-ben-vung":
          $(".zone__content > article").each((index, element) => {
            promises.push(
              new Promise(async (resolve) => {
                // Lấy tiêu đề bài viết
                let title = $(element).find("h3.story__title a").text().trim();

                // Lấy URL của bài viết
                let url = $(element).find("h3.story__title a").attr("href");

                // Lấy ảnh đại diện của bài viết
                let image = $(element)
                  .find("figure.story__thumb img")
                  .attr("src");

                // Lấy thời gian đăng bài viết
                let timeElement = $(element)
                  .find("div.story__meta time")
                  .text()
                  .trim();
                // Loại bỏ dấu | và các khoảng trắng xung quanh nó
                let cleanedTime = timeElement.replace(/\s*\|\s*/, " ");
                // Định dạng lại thời gian
                let time = moment(cleanedTime, "HH:mm DD/MM/YYYY").format(
                  "DD/MM/YYYY HH:mm"
                );

                // Lấy mô tả bài viết
                let description = $(element)
                  .find("div.story__summary")
                  .text()
                  .trim();
                let type = "Doanh nhân";
                // Kiểm tra nếu tất cả các dữ liệu hợp lệ thì push vào listPost
                if (title && url && image && time && description) {
                  listPost.push({
                    title,
                    url,
                    image,
                    time,
                    description,
                    type,
                  });
                }

                // Resolve promise sau khi hoàn tất
                resolve();
              })
            );
          });

          break;
        case "https://doanhnhanvn.vn/doanh-nghiep/tai-chinh-doanh-nghiep":
          $(".zone__content > article").each((index, element) => {
            promises.push(
              new Promise(async (resolve) => {
                // Lấy tiêu đề bài viết
                let title = $(element).find("h3.story__title a").text().trim();

                // Lấy URL của bài viết
                let url = $(element).find("h3.story__title a").attr("href");

                // Lấy ảnh đại diện của bài viết
                let image = $(element)
                  .find("figure.story__thumb img")
                  .attr("src");

                // Lấy thời gian đăng bài viết
                let timeElement = $(element)
                  .find("div.story__meta time")
                  .text()
                  .trim();
                // Loại bỏ dấu | và các khoảng trắng xung quanh nó
                let cleanedTime = timeElement.replace(/\s*\|\s*/, " ");
                // Định dạng lại thời gian
                let time = moment(cleanedTime, "HH:mm DD/MM/YYYY").format(
                  "DD/MM/YYYY HH:mm"
                );

                // Lấy mô tả bài viết
                let description = $(element)
                  .find("div.story__summary")
                  .text()
                  .trim();
                let type = "Doanh nhân";
                // Kiểm tra nếu tất cả các dữ liệu hợp lệ thì push vào listPost
                if (title && url && image && time && description) {
                  listPost.push({
                    title,
                    url,
                    image,
                    time,
                    description,
                    type,
                  });
                }

                // Resolve promise sau khi hoàn tất
                resolve();
              })
            );
          });

          break;
        case "https://doanhnhanvn.vn/tai-chinh/dich-vu-tai-chinh":
          $(".zone__content > article").each((index, element) => {
            promises.push(
              new Promise(async (resolve) => {
                // Lấy tiêu đề bài viết
                let title = $(element).find("h3.story__title a").text().trim();

                // Lấy URL của bài viết
                let url = $(element).find("h3.story__title a").attr("href");

                // Lấy ảnh đại diện của bài viết
                let image = $(element)
                  .find("figure.story__thumb img")
                  .attr("src");

                // Lấy thời gian đăng bài viết
                let timeElement = $(element)
                  .find("div.story__meta time")
                  .text()
                  .trim();
                // Loại bỏ dấu | và các khoảng trắng xung quanh nó
                let cleanedTime = timeElement.replace(/\s*\|\s*/, " ");
                // Định dạng lại thời gian
                let time = moment(cleanedTime, "HH:mm DD/MM/YYYY").format(
                  "DD/MM/YYYY HH:mm"
                );

                // Lấy mô tả bài viết
                let description = $(element)
                  .find("div.story__summary")
                  .text()
                  .trim();
                let type = "Tài chính";
                // Kiểm tra nếu tất cả các dữ liệu hợp lệ thì push vào listPost
                if (title && url && image && time && description) {
                  listPost.push({
                    title,
                    url,
                    image,
                    time,
                    description,
                    type,
                  });
                }

                // Resolve promise sau khi hoàn tất
                resolve();
              })
            );
          });

          break;
        case "https://doanhnhanvn.vn/tai-chinh/ngan-hang":
          $(".zone__content > article").each((index, element) => {
            promises.push(
              new Promise(async (resolve) => {
                // Lấy tiêu đề bài viết
                let title = $(element).find("h3.story__title a").text().trim();

                // Lấy URL của bài viết
                let url = $(element).find("h3.story__title a").attr("href");

                // Lấy ảnh đại diện của bài viết
                let image = $(element)
                  .find("figure.story__thumb img")
                  .attr("src");

                // Lấy thời gian đăng bài viết
                let timeElement = $(element)
                  .find("div.story__meta time")
                  .text()
                  .trim();
                // Loại bỏ dấu | và các khoảng trắng xung quanh nó
                let cleanedTime = timeElement.replace(/\s*\|\s*/, " ");
                // Định dạng lại thời gian
                let time = moment(cleanedTime, "HH:mm DD/MM/YYYY").format(
                  "DD/MM/YYYY HH:mm"
                );

                // Lấy mô tả bài viết
                let description = $(element)
                  .find("div.story__summary")
                  .text()
                  .trim();
                let type = "Ngân hàng";
                // Kiểm tra nếu tất cả các dữ liệu hợp lệ thì push vào listPost
                if (title && url && image && time && description) {
                  listPost.push({
                    title,
                    url,
                    image,
                    time,
                    description,
                    type,
                  });
                }

                // Resolve promise sau khi hoàn tất
                resolve();
              })
            );
          });

          break;
        case "https://doanhnhanvn.vn/tai-chinh/tien-te":
          $(".zone__content > article").each((index, element) => {
            promises.push(
              new Promise(async (resolve) => {
                // Lấy tiêu đề bài viết
                let title = $(element).find("h3.story__title a").text().trim();

                // Lấy URL của bài viết
                let url = $(element).find("h3.story__title a").attr("href");

                // Lấy ảnh đại diện của bài viết
                let image = $(element)
                  .find("figure.story__thumb img")
                  .attr("src");

                // Lấy thời gian đăng bài viết
                let timeElement = $(element)
                  .find("div.story__meta time")
                  .text()
                  .trim();
                // Loại bỏ dấu | và các khoảng trắng xung quanh nó
                let cleanedTime = timeElement.replace(/\s*\|\s*/, " ");
                // Định dạng lại thời gian
                let time = moment(cleanedTime, "HH:mm DD/MM/YYYY").format(
                  "DD/MM/YYYY HH:mm"
                );

                // Lấy mô tả bài viết
                let description = $(element)
                  .find("div.story__summary")
                  .text()
                  .trim();
                let type = "Kinh tế việt nam";
                // Kiểm tra nếu tất cả các dữ liệu hợp lệ thì push vào listPost
                if (title && url && image && time && description) {
                  listPost.push({
                    title,
                    url,
                    image,
                    time,
                    description,
                    type,
                  });
                }

                // Resolve promise sau khi hoàn tất
                resolve();
              })
            );
          });

          break;
        case "https://doanhnhanvn.vn/viet-nam/vi-mo":
          $(".zone__content > article").each((index, element) => {
            promises.push(
              new Promise(async (resolve) => {
                // Lấy tiêu đề bài viết
                let title = $(element).find("h3.story__title a").text().trim();

                // Lấy URL của bài viết
                let url = $(element).find("h3.story__title a").attr("href");

                // Lấy ảnh đại diện của bài viết
                let image = $(element)
                  .find("figure.story__thumb img")
                  .attr("src");

                // Lấy thời gian đăng bài viết
                let timeElement = $(element)
                  .find("div.story__meta time")
                  .text()
                  .trim();
                // Loại bỏ dấu | và các khoảng trắng xung quanh nó
                let cleanedTime = timeElement.replace(/\s*\|\s*/, " ");
                // Định dạng lại thời gian
                let time = moment(cleanedTime, "HH:mm DD/MM/YYYY").format(
                  "DD/MM/YYYY HH:mm"
                );

                // Lấy mô tả bài viết
                let description = $(element)
                  .find("div.story__summary")
                  .text()
                  .trim();
                let type = "Vĩ mô";
                // Kiểm tra nếu tất cả các dữ liệu hợp lệ thì push vào listPost
                if (title && url && image && time && description) {
                  listPost.push({
                    title,
                    url,
                    image,
                    time,
                    description,
                    type,
                  });
                }

                // Resolve promise sau khi hoàn tất
                resolve();
              })
            );
          });

          break;
        case "https://doanhnhanvn.vn/doanh-nhan/kien-thuc-quan-tri":
          $(".zone__content > article").each((index, element) => {
            promises.push(
              new Promise(async (resolve) => {
                // Lấy tiêu đề bài viết
                let title = $(element).find("h3.story__title a").text().trim();

                // Lấy URL của bài viết
                let url = $(element).find("h3.story__title a").attr("href");

                // Lấy ảnh đại diện của bài viết
                let image = $(element)
                  .find("figure.story__thumb img")
                  .attr("src");

                // Lấy thời gian đăng bài viết
                let timeElement = $(element)
                  .find("div.story__meta time")
                  .text()
                  .trim();
                // Loại bỏ dấu | và các khoảng trắng xung quanh nó
                let cleanedTime = timeElement.replace(/\s*\|\s*/, " ");
                // Định dạng lại thời gian
                let time = moment(cleanedTime, "HH:mm DD/MM/YYYY").format(
                  "DD/MM/YYYY HH:mm"
                );

                // Lấy mô tả bài viết
                let description = $(element)
                  .find("div.story__summary")
                  .text()
                  .trim();
                let type = "Doanh nhân";
                // Kiểm tra nếu tất cả các dữ liệu hợp lệ thì push vào listPost
                if (title && url && image && time && description) {
                  listPost.push({
                    title,
                    url,
                    image,
                    time,
                    description,
                    type,
                  });
                }

                // Resolve promise sau khi hoàn tất
                resolve();
              })
            );
          });

          break;
        case "https://doanhnhanvn.vn/doanh-nhan/cong-dong-doanh-nhan":
          $(".zone__content > article").each((index, element) => {
            promises.push(
              new Promise(async (resolve) => {
                // Lấy tiêu đề bài viết
                let title = $(element).find("h3.story__title a").text().trim();

                // Lấy URL của bài viết
                let url = $(element).find("h3.story__title a").attr("href");

                // Lấy ảnh đại diện của bài viết
                let image = $(element)
                  .find("figure.story__thumb img")
                  .attr("src");

                // Lấy thời gian đăng bài viết
                let timeElement = $(element)
                  .find("div.story__meta time")
                  .text()
                  .trim();
                // Loại bỏ dấu | và các khoảng trắng xung quanh nó
                let cleanedTime = timeElement.replace(/\s*\|\s*/, " ");
                // Định dạng lại thời gian
                let time = moment(cleanedTime, "HH:mm DD/MM/YYYY").format(
                  "DD/MM/YYYY HH:mm"
                );

                // Lấy mô tả bài viết
                let description = $(element)
                  .find("div.story__summary")
                  .text()
                  .trim();
                let type = "Doanh nhân";
                // Kiểm tra nếu tất cả các dữ liệu hợp lệ thì push vào listPost
                if (title && url && image && time && description) {
                  listPost.push({
                    title,
                    url,
                    image,
                    time,
                    description,
                    type,
                  });
                }

                // Resolve promise sau khi hoàn tất
                resolve();
              })
            );
          });

          break;
        case "https://doanhnhanvn.vn/doanh-nhan/nha-lanh-dao":
          $(".zone__content > article").each((index, element) => {
            promises.push(
              new Promise(async (resolve) => {
                // Lấy tiêu đề bài viết
                let title = $(element).find("h3.story__title a").text().trim();

                // Lấy URL của bài viết
                let url = $(element).find("h3.story__title a").attr("href");

                // Lấy ảnh đại diện của bài viết
                let image = $(element)
                  .find("figure.story__thumb img")
                  .attr("src");

                // Lấy thời gian đăng bài viết
                let timeElement = $(element)
                  .find("div.story__meta time")
                  .text()
                  .trim();
                // Loại bỏ dấu | và các khoảng trắng xung quanh nó
                let cleanedTime = timeElement.replace(/\s*\|\s*/, " ");
                // Định dạng lại thời gian
                let time = moment(cleanedTime, "HH:mm DD/MM/YYYY").format(
                  "DD/MM/YYYY HH:mm"
                );

                // Lấy mô tả bài viết
                let description = $(element)
                  .find("div.story__summary")
                  .text()
                  .trim();
                let type = "Doanh nhân";
                // Kiểm tra nếu tất cả các dữ liệu hợp lệ thì push vào listPost
                if (title && url && image && time && description) {
                  listPost.push({
                    title,
                    url,
                    image,
                    time,
                    description,
                    type,
                  });
                }

                // Resolve promise sau khi hoàn tất
                resolve();
              })
            );
          });

          break;
        case "https://doanhnhanvn.vn/doanh-nhan/goc-nhin-doanh-nhan":
          $(".zone__content > article").each((index, element) => {
            promises.push(
              new Promise(async (resolve) => {
                // Lấy tiêu đề bài viết
                let title = $(element).find("h3.story__title a").text().trim();

                // Lấy URL của bài viết
                let url = $(element).find("h3.story__title a").attr("href");

                // Lấy ảnh đại diện của bài viết
                let image = $(element)
                  .find("figure.story__thumb img")
                  .attr("src");

                // Lấy thời gian đăng bài viết
                let timeElement = $(element)
                  .find("div.story__meta time")
                  .text()
                  .trim();
                // Loại bỏ dấu | và các khoảng trắng xung quanh nó
                let cleanedTime = timeElement.replace(/\s*\|\s*/, " ");
                // Định dạng lại thời gian
                let time = moment(cleanedTime, "HH:mm DD/MM/YYYY").format(
                  "DD/MM/YYYY HH:mm"
                );

                // Lấy mô tả bài viết
                let description = $(element)
                  .find("div.story__summary")
                  .text()
                  .trim();
                let type = "Doanh nhân";
                // Kiểm tra nếu tất cả các dữ liệu hợp lệ thì push vào listPost
                if (title && url && image && time && description) {
                  listPost.push({
                    title,
                    url,
                    image,
                    time,
                    description,
                    type,
                  });
                }

                // Resolve promise sau khi hoàn tất
                resolve();
              })
            );
          });

          break;
        case "https://doanhnhanvn.vn/doanh-nhan/dau-an-nam-chau":
          $(".zone__content > article").each((index, element) => {
            promises.push(
              new Promise(async (resolve) => {
                // Lấy tiêu đề bài viết
                let title = $(element).find("h3.story__title a").text().trim();

                // Lấy URL của bài viết
                let url = $(element).find("h3.story__title a").attr("href");

                // Lấy ảnh đại diện của bài viết
                let image = $(element)
                  .find("figure.story__thumb img")
                  .attr("src");

                // Lấy thời gian đăng bài viết
                let timeElement = $(element)
                  .find("div.story__meta time")
                  .text()
                  .trim();
                // Loại bỏ dấu | và các khoảng trắng xung quanh nó
                let cleanedTime = timeElement.replace(/\s*\|\s*/, " ");
                // Định dạng lại thời gian
                let time = moment(cleanedTime, "HH:mm DD/MM/YYYY").format(
                  "DD/MM/YYYY HH:mm"
                );

                // Lấy mô tả bài viết
                let description = $(element)
                  .find("div.story__summary")
                  .text()
                  .trim();
                let type = "Doanh nhân";
                // Kiểm tra nếu tất cả các dữ liệu hợp lệ thì push vào listPost
                if (title && url && image && time && description) {
                  listPost.push({
                    title,
                    url,
                    image,
                    time,
                    description,
                    type,
                  });
                }

                // Resolve promise sau khi hoàn tất
                resolve();
              })
            );
          });

          break;
        case "https://doanhnhanvn.vn/doanh-nhan/khoi-nghiep":
          $(".zone__content > article").each((index, element) => {
            promises.push(
              new Promise(async (resolve) => {
                // Lấy tiêu đề bài viết
                let title = $(element).find("h3.story__title a").text().trim();

                // Lấy URL của bài viết
                let url = $(element).find("h3.story__title a").attr("href");

                // Lấy ảnh đại diện của bài viết
                let image = $(element)
                  .find("figure.story__thumb img")
                  .attr("src");

                // Lấy thời gian đăng bài viết
                let timeElement = $(element)
                  .find("div.story__meta time")
                  .text()
                  .trim();
                // Loại bỏ dấu | và các khoảng trắng xung quanh nó
                let cleanedTime = timeElement.replace(/\s*\|\s*/, " ");
                // Định dạng lại thời gian
                let time = moment(cleanedTime, "HH:mm DD/MM/YYYY").format(
                  "DD/MM/YYYY HH:mm"
                );

                // Lấy mô tả bài viết
                let description = $(element)
                  .find("div.story__summary")
                  .text()
                  .trim();
                let type = "Khởi nghiệp";
                // Kiểm tra nếu tất cả các dữ liệu hợp lệ thì push vào listPost
                if (title && url && image && time && description) {
                  listPost.push({
                    title,
                    url,
                    image,
                    time,
                    description,
                    type,
                  });
                }

                // Resolve promise sau khi hoàn tất
                resolve();
              })
            );
          });

          break;
        case "https://doanhnhanvn.vn/the-gioi/kinh-te-quoc-te":
          $(".zone__content > article").each((index, element) => {
            promises.push(
              new Promise(async (resolve) => {
                // Lấy tiêu đề bài viết
                let title = $(element).find("h3.story__title a").text().trim();

                // Lấy URL của bài viết
                let url = $(element).find("h3.story__title a").attr("href");

                // Lấy ảnh đại diện của bài viết
                let image = $(element)
                  .find("figure.story__thumb img")
                  .attr("src");

                // Lấy thời gian đăng bài viết
                let timeElement = $(element)
                  .find("div.story__meta time")
                  .text()
                  .trim();
                // Loại bỏ dấu | và các khoảng trắng xung quanh nó
                let cleanedTime = timeElement.replace(/\s*\|\s*/, " ");
                // Định dạng lại thời gian
                let time = moment(cleanedTime, "HH:mm DD/MM/YYYY").format(
                  "DD/MM/YYYY HH:mm"
                );

                // Lấy mô tả bài viết
                let description = $(element)
                  .find("div.story__summary")
                  .text()
                  .trim();
                let type = "Kinh tế quốc tế";
                // Kiểm tra nếu tất cả các dữ liệu hợp lệ thì push vào listPost
                if (title && url && image && time && description) {
                  listPost.push({
                    title,
                    url,
                    image,
                    time,
                    description,
                    type,
                  });
                }

                // Resolve promise sau khi hoàn tất
                resolve();
              })
            );
          });

          break;
        case "https://baochinhphu.vn/kinh-te/chung-khoan.htm":
          $(
            ".box-category-middle .box-category-item, .box-category-middle .box-category-item-sub, .list__lmain .box-stream-item"
          ).each((index, element) => {
            // Lấy tiêu đề bài viết
            const title = $(element)
              .find(".box-category-link-title, .box-stream-link-title")
              .text()
              .trim();

            // Lấy URL bài viết
            const url = $(element)
              .find(".box-category-link-title, .box-stream-link-title")
              .attr("href");

            // Nếu URL không hợp lệ, bỏ qua bài viết này
            if (!url) return;

            // Tạo URL đầy đủ của bài viết
            const fullUrl = `https://baochinhphu.vn${url}`;

            // Lấy ảnh đại diện của bài viết
            const image = $(element).find("img").attr("src") || null;

            // Lấy thời gian đăng bài viết

            const timeTitle =
              $(element)
                .find(".box-category-time, .box-stream-time")
                .attr("title") || null;

            // Sử dụng Moment.js để phân tích và định dạng lại thời gian
            const time = moment(timeTitle, "MM/DD/YYYY h:mm:ss A").format(
              "DD/MM/YYYY HH:mm"
            );

            // Lấy mô tả (description) của bài viết
            const description =
              $(element)
                .find(".box-category-sapo, .box-stream-sapo")
                .text()
                .trim()
                .replace(/\(Chinhphu.vn\) - /g, "") || null;
            const type = "Chứng khoán";
            // Nếu tất cả dữ liệu đều tồn tại, thêm bài viết vào listPost
            if (title && fullUrl && image && time && description) {
              listPost.push({
                title,
                url: fullUrl,
                image,
                time,
                description,
                type,
              });
            }
          });

          break;
        case "https://baochinhphu.vn/kinh-te/ngan-hang.htm":
          $(
            ".box-category-middle .box-category-item, .box-category-middle .box-category-item-sub, .list__lmain .box-stream-item"
          ).each((index, element) => {
            // Lấy tiêu đề bài viết
            const title = $(element)
              .find(".box-category-link-title, .box-stream-link-title")
              .text()
              .trim();

            // Lấy URL bài viết
            const url = $(element)
              .find(".box-category-link-title, .box-stream-link-title")
              .attr("href");

            // Nếu URL không hợp lệ, bỏ qua bài viết này
            if (!url) return;

            // Tạo URL đầy đủ của bài viết
            const fullUrl = `https://baochinhphu.vn${url}`;

            // Lấy ảnh đại diện của bài viết
            const image = $(element).find("img").attr("src") || null;

            // Lấy thời gian đăng bài viết
            const timeTitle =
              $(element)
                .find(".box-category-time, .box-stream-time")
                .attr("title") || null;

            // Sử dụng Moment.js để phân tích và định dạng lại thời gian
            const time = moment(timeTitle, "MM/DD/YYYY h:mm:ss A").format(
              "DD/MM/YYYY HH:mm"
            );

            const description =
              $(element)
                .find(".box-category-sapo, .box-stream-sapo")
                .text()
                .trim()
                .replace(/\(Chinhphu.vn\) - /g, "") || null;
            const type = "Ngân hàng";
            // Nếu tất cả dữ liệu đều tồn tại, thêm bài viết vào listPost
            if (title && fullUrl && image && time && description) {
              listPost.push({
                title,
                url: fullUrl,
                image,
                time,
                description,
                type,
              });
            }
          });

          break;
        case "https://baochinhphu.vn/kinh-te/thi-truong.htm":
          $(
            ".box-category-middle .box-category-item, .box-category-middle .box-category-item-sub, .list__lmain .box-stream-item"
          ).each((index, element) => {
            // Lấy tiêu đề bài viết
            const title = $(element)
              .find(".box-category-link-title, .box-stream-link-title")
              .text()
              .trim();

            // Lấy URL bài viết
            const url = $(element)
              .find(".box-category-link-title, .box-stream-link-title")
              .attr("href");

            // Nếu URL không hợp lệ, bỏ qua bài viết này
            if (!url) return;

            // Tạo URL đầy đủ của bài viết
            const fullUrl = `https://baochinhphu.vn${url}`;

            // Lấy ảnh đại diện của bài viết
            const image = $(element).find("img").attr("src") || null;

            // Lấy thời gian đăng bài viết
            const timeTitle =
              $(element)
                .find(".box-category-time, .box-stream-time")
                .attr("title") || null;

            // Sử dụng Moment.js để phân tích và định dạng lại thời gian
            const time = moment(timeTitle, "MM/DD/YYYY h:mm:ss A").format(
              "DD/MM/YYYY HH:mm"
            );

            // Lấy mô tả (description) của bài viết
            const description =
              $(element)
                .find(".box-category-sapo, .box-stream-sapo")
                .text()
                .trim()
                .replace(/\(Chinhphu.vn\) - /g, "") || null;
            const type = "Kinh tế việt nam";
            // Nếu tất cả dữ liệu đều tồn tại, thêm bài viết vào listPost
            if (title && fullUrl && image && time && description) {
              listPost.push({
                title,
                url: fullUrl,
                image,
                time,
                description,
                type,
              });
            }
          });

          break;
        case "https://baochinhphu.vn/xa-hoi.htm":
          $(
            ".box-category-middle .box-category-item, .box-category-middle .box-category-item-sub, .list__lmain .box-stream-item"
          ).each((index, element) => {
            // Lấy tiêu đề bài viết
            const title = $(element)
              .find(".box-category-link-title, .box-stream-link-title")
              .text()
              .trim();

            // Lấy URL bài viết
            const url = $(element)
              .find(".box-category-link-title, .box-stream-link-title")
              .attr("href");

            // Nếu URL không hợp lệ, bỏ qua bài viết này
            if (!url) return;

            // Tạo URL đầy đủ của bài viết
            const fullUrl = `https://baochinhphu.vn${url}`;

            // Lấy ảnh đại diện của bài viết
            const image = $(element).find("img").attr("src") || null;

            // Lấy thời gian đăng bài viết
            const timeTitle =
              $(element)
                .find(".box-category-time, .box-stream-time")
                .attr("title") || null;

            // Sử dụng Moment.js để phân tích và định dạng lại thời gian
            const time = moment(timeTitle, "MM/DD/YYYY h:mm:ss A").format(
              "DD/MM/YYYY HH:mm"
            );

            // Lấy mô tả (description) của bài viết
            const description =
              $(element)
                .find(".box-category-sapo, .box-stream-sapo")
                .text()
                .trim()
                .replace(/\(Chinhphu.vn\) - /g, "") || null;
            const type = "Xã hội";
            // Nếu tất cả dữ liệu đều tồn tại, thêm bài viết vào listPost
            if (title && fullUrl && image && time && description) {
              listPost.push({
                title,
                url: fullUrl,
                image,
                time,
                description,
                type,
              });
            }
          });

          break;
        case "https://baochinhphu.vn/kinh-te/khoi-nghiep.htm":
          $(
            ".box-category-middle .box-category-item, .box-category-middle .box-category-item-sub, .list__lmain .box-stream-item"
          ).each((index, element) => {
            // Lấy tiêu đề bài viết
            const title = $(element)
              .find(".box-category-link-title, .box-stream-link-title")
              .text()
              .trim();

            // Lấy URL bài viết
            const url = $(element)
              .find(".box-category-link-title, .box-stream-link-title")
              .attr("href");

            // Nếu URL không hợp lệ, bỏ qua bài viết này
            if (!url) return;

            // Tạo URL đầy đủ của bài viết
            const fullUrl = `https://baochinhphu.vn${url}`;

            // Lấy ảnh đại diện của bài viết
            const image = $(element).find("img").attr("src") || null;

            // Lấy thời gian đăng bài viết
            const timeTitle =
              $(element)
                .find(".box-category-time, .box-stream-time")
                .attr("title") || null;

            // Sử dụng Moment.js để phân tích và định dạng lại thời gian
            const time = moment(timeTitle, "MM/DD/YYYY h:mm:ss A").format(
              "DD/MM/YYYY HH:mm"
            );

            // Lấy mô tả (description) của bài viết
            const description =
              $(element)
                .find(".box-category-sapo, .box-stream-sapo")
                .text()
                .trim()
                .replace(/\(Chinhphu.vn\) - /g, "") || null;
            const type = "Khởi nghiệp";
            // Nếu tất cả dữ liệu đều tồn tại, thêm bài viết vào listPost
            if (title && fullUrl && image && time && description) {
              listPost.push({
                title,
                url: fullUrl,
                image,
                time,
                description,
                type,
              });
            }
          });

          break;
        case "https://chatluongvacuocsong.vn/bat-dong-san/":
          $(
            ".d-flex.flex-wrap .col-sm-6, .col-lg-8, .col-sm-7, .col-xl-7"
          ).each((index, element) => {
            const title = $(element).find("h1 a, h2 a, h4 a").attr("title");

            const url = $(element).find("h1 a, h2 a, h4 a").attr("href");
            if (!url || url.startsWith("javascript")) return;

            const fullUrl = url.startsWith("http")
              ? url
              : `https://chatluongvacuocsong.vn${url}`;

            const image = $(element)
              .closest(".d-flex.flex-wrap")
              .find(".col-sm-5 img")
              .attr("src");

            // Lấy thời gian từ vị trí phù hợp
            var time = $(element)
              .find(".text-secondary")
              .text()
              .trim()
              .replace(/(\d+)\/(\d+)\/(\d+), (\d+:\d+)/, "$3-$2-$1 $4");

            // Lấy mô tả và loại bỏ chuỗi không mong muốn
            const description = $(element)
              .find("p.fs-15")
              .text()
              .trim()
              .replace("(CL&CS) - ", "");

            const type = "Bất động sản";

            if (title && fullUrl && time && description) {
              listPost.push({
                title,
                url: fullUrl,
                image,
                time,
                description,
                type,
              });
            }
          });

          break;
        case "https://chatluongvacuocsong.vn/tai-chinh-ngan-hang/":
          $(
            ".d-flex.flex-wrap .col-sm-6, .col-lg-8, .col-sm-7, .col-xl-7"
          ).each((index, element) => {
            const title = $(element).find("h1 a, h2 a, h4 a").attr("title");
            const url = $(element).find("h1 a, h2 a, h4 a").attr("href");
            if (!url || url.startsWith("javascript")) return;

            const fullUrl = url.startsWith("http")
              ? url
              : `https://chatluongvacuocsong.vn${url}`;
            const image = $(element)
              .closest(".d-flex.flex-wrap")
              .find(".col-sm-5 img")
              .attr("src");

            // Lấy thời gian từ vị trí phù hợp
            var time = $(element)
              .find(".text-secondary")
              .text()
              .trim()
              .replace(/(\d+)\/(\d+)\/(\d+), (\d+:\d+)/, "$3-$2-$1 $4");

            // Lấy mô tả và loại bỏ chuỗi không mong muốn
            const description = $(element)
              .find("p.fs-15")
              .text()
              .trim()
              .replace("(CL&CS) - ", "");
            const type = "Tài chính";

            if (title && fullUrl && time && description) {
              listPost.push({
                title,
                url: fullUrl,
                image,
                time,
                description,
                type,
              });
            }
          });

          break;
        case "https://chatluongvacuocsong.vn/kinh-te/":
          $(
            ".d-flex.flex-wrap .col-sm-6, .col-lg-8, .col-sm-7, .col-xl-7"
          ).each((index, element) => {
            const title = $(element).find("h1 a, h2 a, h4 a").attr("title");
            const url = $(element).find("h1 a, h2 a, h4 a").attr("href");
            if (!url || url.startsWith("javascript")) return;

            const fullUrl = url.startsWith("http")
              ? url
              : `https://chatluongvacuocsong.vn${url}`;
            const image = $(element)
              .closest(".d-flex.flex-wrap")
              .find(".col-sm-5 img")
              .attr("src");

            // Lấy thời gian từ vị trí phù hợp
            var time = $(element)
              .find(".text-secondary")
              .text()
              .trim()
              .replace(/(\d+)\/(\d+)\/(\d+), (\d+:\d+)/, "$3-$2-$1 $4");

            // Lấy mô tả và loại bỏ chuỗi không mong muốn
            const description = $(element)
              .find("p.fs-15")
              .text()
              .trim()
              .replace("(CL&CS) - ", "");
            const type = "Kinh tế";

            if (title && fullUrl && time && description) {
              listPost.push({
                title,
                url: fullUrl,
                image,
                time,
                description,
                type,
              });
            }
          });

          break;
        case "https://chatluongvacuocsong.vn/van-hoa-doi-song/":
          $(
            ".d-flex.flex-wrap .col-sm-6, .col-lg-8, .col-sm-7, .col-xl-7"
          ).each((index, element) => {
            const title = $(element).find("h1 a, h2 a, h4 a").attr("title");
            const url = $(element).find("h1 a, h2 a, h4 a").attr("href");
            if (!url || url.startsWith("javascript")) return;

            const fullUrl = url.startsWith("http")
              ? url
              : `https://chatluongvacuocsong.vn${url}`;

            const image = $(element)
              .closest(".d-flex.flex-wrap")
              .find(".col-sm-5 img")
              .attr("src");

            // Lấy thời gian từ vị trí phù hợp
            var time = $(element)
              .find(".text-secondary")
              .text()
              .trim()
              .replace(/(\d+)\/(\d+)\/(\d+), (\d+:\d+)/, "$3-$2-$1 $4");

            // Lấy mô tả và loại bỏ chuỗi không mong muốn
            const description = $(element)
              .find("p.fs-15")
              .text()
              .trim()
              .replace("(CL&CS) - ", "");
            const type = "Xã hội";

            if (title && fullUrl && time && description) {
              listPost.push({
                title,
                url: fullUrl,
                image,
                time,
                description,
                type,
              });
            }
          });

          break;
        case "https://chatluongvacuocsong.vn/doanh-nghiep--doanh-nhan/":
          $(
            ".d-flex.flex-wrap .col-sm-6, .col-lg-8, .col-sm-7, .col-xl-7"
          ).each((index, element) => {
            const title = $(element).find("h1 a, h2 a, h4 a").attr("title");
            const url = $(element).find("h1 a, h2 a, h4 a").attr("href");
            if (!url || url.startsWith("javascript")) return;

            const fullUrl = url.startsWith("http")
              ? url
              : `https://chatluongvacuocsong.vn${url}`;

            const image = $(element)
              .closest(".d-flex.flex-wrap")
              .find(".col-sm-5 img")
              .attr("src");

            // Lấy thời gian từ vị trí phù hợp
            var time = $(element)
              .find(".text-secondary")
              .text()
              .trim()
              .replace(/(\d+)\/(\d+)\/(\d+), (\d+:\d+)/, "$3-$2-$1 $4");

            // Lấy mô tả và loại bỏ chuỗi không mong muốn
            const description = $(element)
              .find("p.fs-15")
              .text()
              .trim()
              .replace("(CL&CS) - ", "");
            const type = "Doanh nhân";

            if (title && fullUrl && time && description) {
              listPost.push({
                title,
                url: fullUrl,
                image,
                time,
                description,
                type,
              });
            }
          });

          break;

        case "https://doanhnghiepkinhdoanh.doanhnhanvn.vn/vi-mo.htm":
          $(".row .col-lg-6").each((index, element) => {
            // Lấy tiêu đề bài viết (title)
            let title = $(element).find("a.title-link").text().trim();

            // Lấy URL của bài viết (url)
            let url = $(element).find("a.title-link").attr("href");

            // Lấy thời gian đăng bài viết (time)
            let image = $(element).find("img.img-fluid").attr("src");

            // Lấy thời gian đăng bài viết (time)
            let time = $(element).find("small").text().trim();

            // Lấy mô tả bài viết (description)
            let description = $(element).find("p.sapo").text().trim();
            let type = "Vĩ mô";
            // Kiểm tra nếu có đủ thông tin cần thiết
            if (title && url && time && description && type) {
              listPost.push({
                title,
                url,
                image,
                time,
                description,
                type,
              });
            }
          });
          break;
        case "https://doanhnghiepkinhdoanh.doanhnhanvn.vn/tai-chinh-doanh-nghiep.htm":
          $(".row .col-lg-6").each((index, element) => {
            // Lấy tiêu đề bài viết (title)
            let title = $(element).find("a.title-link").text().trim();

            // Lấy URL của bài viết (url)
            let url = $(element).find("a.title-link").attr("href");

            // Lấy thời gian đăng bài viết (time)
            let image = $(element).find("img.img-fluid").attr("src");

            // Lấy thời gian đăng bài viết (time)
            let time = $(element).find("small").text().trim();

            // Lấy mô tả bài viết (description)
            let description = $(element).find("p.sapo").text().trim();
            let type = "Doanh nghiệp";
            // Kiểm tra nếu có đủ thông tin cần thiết
            if (title && url && time && description && type) {
              listPost.push({
                title,
                url,
                image,
                time,
                description,
                type,
              });
            }
          });
          break;
        case "https://doanhnghiepkinhdoanh.doanhnhanvn.vn/kinh-te-quoc-te.htm":
          $(".row .col-lg-6").each((index, element) => {
            // Lấy tiêu đề bài viết (title)
            let title = $(element).find("a.title-link").text().trim();

            // Lấy URL của bài viết (url)
            let url = $(element).find("a.title-link").attr("href");

            // Lấy thời gian đăng bài viết (time)
            let image = $(element).find("img.img-fluid").attr("src");

            // Lấy thời gian đăng bài viết (time)
            let time = $(element).find("small").text().trim();

            // Lấy mô tả bài viết (description)
            let description = $(element).find("p.sapo").text().trim();
            let type = "Kinh tế quốc tế";
            // Kiểm tra nếu có đủ thông tin cần thiết
            if (title && url && time && description && type) {
              listPost.push({
                title,
                url,
                image,
                time,
                description,
                type,
              });
            }
          });
          break;
        case "https://doanhnghiepkinhdoanh.doanhnhanvn.vn/khoi-nghiep-sang-tao.htm":
          $(".row .col-lg-6").each((index, element) => {
            // Lấy tiêu đề bài viết (title)
            let title = $(element).find("a.title-link").text().trim();

            // Lấy URL của bài viết (url)
            let url = $(element).find("a.title-link").attr("href");

            // Lấy thời gian đăng bài viết (time)
            let image = $(element).find("img.img-fluid").attr("src");

            // Lấy thời gian đăng bài viết (time)
            let time = $(element).find("small").text().trim();

            // Lấy mô tả bài viết (description)
            let description = $(element).find("p.sapo").text().trim();
            let type = "Khởi nghiệp";
            // Kiểm tra nếu có đủ thông tin cần thiết
            if (title && url && time && description && type) {
              listPost.push({
                title,
                url,
                image,
                time,
                description,
                type,
              });
            }
          });
          break;
        // case "https://baochinhphu.vn":
        //   $(".box-focus-item").each((index, element) => {
        //     promises.push(
        //       new Promise(async (resolve) => {
        //         let title = $(element).find("a").text().trim();
        //         let url = $(element).find("a").attr("href");
        //         //   let image = $(element).find("img").attr("src");
        //         if (
        //           url.includes("en.baochinhphu.vn") ||
        //           url.includes("cn.baochinhphu.vn") ||
        //           url.includes("media.chinhphu.vn")
        //         ) {
        //           resolve();
        //         } else {
        //           const responseDetail = await axios.get(`${sourceUrl}${url}`);
        //           const htmlDetail = responseDetail.data;
        //           const $Detail = cheerio.load(htmlDetail);
        //           let image = $Detail(".detail-content")
        //             ?.find("img")
        //             ?.attr("src");
        //           if (!image) {
        //             image = $Detail(".containe-777")?.find("img")?.attr("src");
        //           }
        //           let time = $Detail(".detail-time")
        //             ?.text()
        //             ?.trim()
        //             ?.replaceAll("\n", "")
        //             ?.replace(/\s+/g, " ");
        //           if (time === "") {
        //             time = $Detail(".time")?.text()?.trim()?.slice(0, 16);
        //           }
        //           let description = $Detail(".detail-sapo")?.text()?.trim();
        //           if (description === "") {
        //             description = $Detail(".list__rf-sapo")?.text()?.trim();
        //           }
        //           listPost.push({
        //             title,
        //             url: `${sourceUrl}${url}`,
        //             image,
        //             time,
        //             description,
        //           });
        //           resolve();
        //         }
        //       })
        //     );
        //   });

        //   $(".home__sfw-item").each((index, element) => {
        //     promises.push(
        //       new Promise(async (resolve) => {
        //         let title = $(element).find("a").text().trim();
        //         let url = $(element).find("a").attr("href");
        //         //   let image = $(element).find("img").attr("src");
        //         if (
        //           url.includes("en.baochinhphu.vn") ||
        //           url.includes("cn.baochinhphu.vn") ||
        //           url.includes("media.chinhphu.vn")
        //         ) {
        //           resolve();
        //         } else {
        //           const responseDetail = await axios.get(`${sourceUrl}${url}`);
        //           const htmlDetail = responseDetail.data;
        //           const $Detail = cheerio.load(htmlDetail);
        //           let image = $Detail(".detail-content")
        //             ?.find("img")
        //             ?.attr("src");
        //           if (!image) {
        //             image = $Detail(".containe-777")?.find("img")?.attr("src");
        //           }
        //           let time = $Detail(".detail-time")
        //             ?.text()
        //             ?.trim()
        //             ?.replaceAll("\n", "")
        //             ?.replace(/\s+/g, " ");
        //           if (time === "") {
        //             time = $Detail(".time")?.text()?.trim()?.slice(0, 16);
        //           }
        //           let description = $Detail(".detail-sapo")?.text()?.trim();
        //           if (description === "") {
        //             description = $Detail(".list__rf-sapo")?.text()?.trim();
        //           }
        //           listPost.push({
        //             title,
        //             url: `${sourceUrl}${url}`,
        //             image,
        //             time,
        //             description,
        //           });
        //           resolve();
        //         }
        //       })
        //     );
        //   });

        //   $(".box-item-top").each((index, element) => {
        //     promises.push(
        //       new Promise(async (resolve) => {
        //         let title = $(element).find("a").text().trim();
        //         let url = $(element).find("a").attr("href");
        //         //   let image = $(element).find("img").attr("src");
        //         if (
        //           url.includes("en.baochinhphu.vn") ||
        //           url.includes("cn.baochinhphu.vn") ||
        //           url.includes("media.chinhphu.vn")
        //         ) {
        //           resolve();
        //         } else {
        //           const responseDetail = await axios.get(`${sourceUrl}${url}`);
        //           const htmlDetail = responseDetail.data;
        //           const $Detail = cheerio.load(htmlDetail);
        //           let image = $Detail(".detail-content")
        //             ?.find("img")
        //             ?.attr("src");
        //           if (!image) {
        //             image = $Detail(".containe-777")?.find("img")?.attr("src");
        //           }
        //           let time = $Detail(".detail-time")
        //             ?.text()
        //             ?.trim()
        //             ?.replaceAll("\n", "")
        //             ?.replace(/\s+/g, " ");
        //           if (time === "") {
        //             time = $Detail(".time")?.text()?.trim()?.slice(0, 16);
        //           }
        //           let description = $Detail(".detail-sapo")?.text()?.trim();
        //           if (description === "") {
        //             description = $Detail(".list__rf-sapo")?.text()?.trim();
        //           }
        //           listPost.push({
        //             title,
        //             url: `${sourceUrl}${url}`,
        //             image,
        //             time,
        //             description,
        //           });
        //           resolve();
        //         }
        //       })
        //     );
        //   });

        //   $(".home-box-related-item").each((index, element) => {
        //     promises.push(
        //       new Promise(async (resolve) => {
        //         let title = $(element).find("a").text().trim();
        //         let url = $(element).find("a").attr("href");
        //         //   let image = $(element).find("img").attr("src");
        //         if (
        //           url.includes("en.baochinhphu.vn") ||
        //           url.includes("cn.baochinhphu.vn") ||
        //           url.includes("media.chinhphu.vn")
        //         ) {
        //           resolve();
        //         } else {
        //           const responseDetail = await axios.get(`${sourceUrl}${url}`);
        //           const htmlDetail = responseDetail.data;
        //           const $Detail = cheerio.load(htmlDetail);
        //           let image = $Detail(".detail-content")
        //             ?.find("img")
        //             ?.attr("src");
        //           if (!image) {
        //             image = $Detail(".containe-777")?.find("img")?.attr("src");
        //           }
        //           let time = $Detail(".detail-time")
        //             ?.text()
        //             ?.trim()
        //             ?.replaceAll("\n", "")
        //             ?.replace(/\s+/g, " ");
        //           if (time === "") {
        //             time = $Detail(".time")?.text()?.trim()?.slice(0, 16);
        //           }
        //           let description = $Detail(".detail-sapo")?.text()?.trim();
        //           if (description === "") {
        //             description = $Detail(".list__rf-sapo")?.text()?.trim();
        //           }
        //           listPost.push({
        //             title,
        //             url: `${sourceUrl}${url}`,
        //             image,
        //             time,
        //             description,
        //           });
        //           resolve();
        //         }
        //       })
        //     );
        //   });

        //   $(".box-focus-item-sm").each((index, element) => {
        //     promises.push(
        //       new Promise(async (resolve) => {
        //         let title = $(element).find("a").text().trim();
        //         let url = $(element).find("a").attr("href");
        //         //   let image = $(element).find("img").attr("src");
        //         if (
        //           url.includes("en.baochinhphu.vn") ||
        //           url.includes("cn.baochinhphu.vn") ||
        //           url.includes("media.chinhphu.vn")
        //         ) {
        //           resolve();
        //         } else {
        //           const responseDetail = await axios.get(`${sourceUrl}${url}`);
        //           const htmlDetail = responseDetail.data;
        //           const $Detail = cheerio.load(htmlDetail);
        //           let image = $Detail(".detail-content")
        //             ?.find("img")
        //             ?.attr("src");
        //           if (!image) {
        //             image = $Detail(".containe-777")?.find("img")?.attr("src");
        //           }
        //           let time = $Detail(".detail-time")
        //             ?.text()
        //             ?.trim()
        //             ?.replaceAll("\n", "")
        //             ?.replace(/\s+/g, " ");
        //           if (time === "") {
        //             time = $Detail(".time")?.text()?.trim()?.slice(0, 16);
        //           }
        //           let description = $Detail(".detail-sapo")?.text()?.trim();
        //           if (description === "") {
        //             description = $Detail(".list__rf-sapo")?.text()?.trim();
        //           }
        //           listPost.push({
        //             title,
        //             url: `${sourceUrl}${url}`,
        //             image,
        //             time,
        //             description,
        //           });
        //           resolve();
        //         }
        //       })
        //     );
        //   });

        //   $(".box-item").each((index, element) => {
        //     promises.push(
        //       new Promise(async (resolve) => {
        //         let title = $(element).find("a").text().trim();
        //         let url = $(element).find("a").attr("href");
        //         //   let image = $(element).find("img").attr("src");
        //         if (
        //           url.includes("en.baochinhphu.vn") ||
        //           url.includes("cn.baochinhphu.vn") ||
        //           url.includes("media.chinhphu.vn")
        //         ) {
        //           resolve();
        //         } else {
        //           const responseDetail = await axios.get(`${sourceUrl}${url}`);
        //           const htmlDetail = responseDetail.data;
        //           const $Detail = cheerio.load(htmlDetail);
        //           let image = $Detail(".detail-content")
        //             ?.find("img")
        //             ?.attr("src");
        //           if (!image) {
        //             image = $Detail(".containe-777")?.find("img")?.attr("src");
        //           }
        //           let time = $Detail(".detail-time")
        //             ?.text()
        //             ?.trim()
        //             ?.replaceAll("\n", "")
        //             ?.replace(/\s+/g, " ");
        //           if (time === "") {
        //             time = $Detail(".time")?.text()?.trim()?.slice(0, 16);
        //           }
        //           let description = $Detail(".detail-sapo")?.text()?.trim();
        //           if (description === "") {
        //             description = $Detail(".list__rf-sapo")?.text()?.trim();
        //           }
        //           listPost.push({
        //             title,
        //             url: `${sourceUrl}${url}`,
        //             image,
        //             time,
        //             description,
        //           });
        //           resolve();
        //         }
        //       })
        //     );
        //   });

        //   $(".box-item-sub-link").each((index, element) => {
        //     promises.push(
        //       new Promise(async (resolve) => {
        //         let title = $(element).find("a").text().trim();
        //         let url = $(element).find("a").attr("href");
        //         //   let image = $(element).find("img").attr("src");
        //         if (
        //           url.includes("en.baochinhphu.vn") ||
        //           url.includes("cn.baochinhphu.vn") ||
        //           url.includes("media.chinhphu.vn")
        //         ) {
        //           resolve();
        //         } else {
        //           const responseDetail = await axios.get(`${sourceUrl}${url}`);
        //           const htmlDetail = responseDetail.data;
        //           const $Detail = cheerio.load(htmlDetail);
        //           let image = $Detail(".detail-content")
        //             ?.find("img")
        //             ?.attr("src");
        //           if (!image) {
        //             image = $Detail(".containe-777")?.find("img")?.attr("src");
        //           }
        //           let time = $Detail(".detail-time")
        //             ?.text()
        //             ?.trim()
        //             ?.replaceAll("\n", "")
        //             ?.replace(/\s+/g, " ");
        //           if (time === "") {
        //             time = $Detail(".time")?.text()?.trim()?.slice(0, 16);
        //           }
        //           let description = $Detail(".detail-sapo")?.text()?.trim();
        //           if (description === "") {
        //             description = $Detail(".list__rf-sapo")?.text()?.trim();
        //           }
        //           listPost.push({
        //             title,
        //             url: `${sourceUrl}${url}`,
        //             image,
        //             time,
        //             description,
        //           });
        //           resolve();
        //         }
        //       })
        //     );
        //   });
        //   break;
        // case "https://chatluongvacuocsong.vn":
        //   $(".section-news-main").each((index, element) => {
        //     promises.push(
        //       new Promise(async (resolve) => {
        //         let title = $(element).find(".card-title").text().trim();
        //         let url = $(element).find(".card-title > a").attr("href");
        //         let image = $(element).find("img").attr("src");
        //         let time = $(element).find(".px-1").text().trim();
        //         let description = $(element).find("p.fix-text3").text().trim();
        //         listPost.push({
        //           title,
        //           url,
        //           image,
        //           time,
        //           description,
        //         });
        //         resolve();
        //       })
        //     );
        //   });
        //   $(".mini-news_item").each((index, element) => {
        //     promises.push(
        //       new Promise(async (resolve) => {
        //         let title = $(element).find(".font-weight-bold").text().trim();
        //         let url = $(element).find(".font-weight-bold > a").attr("href");
        //         //   let image = $(element).find("img").attr("src");
        //         //   let time = $(element).find(".px-1").text().trim();
        //         //   let description = $(element).find("p.fix-text3").text().trim();
        //         if (!title || !url) {
        //           resolve();
        //         } else {
        //           listPost.push({
        //             title,
        //             url,
        //             image: null,
        //             time: null,
        //             description: null,
        //           });
        //           resolve();
        //         }
        //       })
        //     );
        //   });
        //   $(".section-news-list > div > div").each((index, element) => {
        //     promises.push(
        //       new Promise(async (resolve) => {
        //         let title = $(element).find("h2").text().trim();
        //         let url = $(element).find("a").attr("href");
        //         let image = $(element).find("img").attr("src");
        //         // let time = $(element).find(".px-1").text().trim();
        //         // let description = $(element).find("p.fix-text3").text().trim();
        //         listPost.push({
        //           title,
        //           url,
        //           image,
        //           time: null,
        //           description: null,
        //         });
        //         resolve();
        //       })
        //     );
        //   });
        //   break;
        // case "https://dautu.kinhtechungkhoan.vn":
        //   $(".article-title").each((index, element) => {
        //     promises.push(
        //       new Promise(async (resolve) => {
        //         let title = $(element).find(".article-title > a").text().trim();
        //         let url = $(element).find("a").attr("href");
        //         let image = $(element).find("img").attr("src");
        //         // let time = $(element).find(".time").text().trim();
        //         let description = $(element)
        //           .find(".article-desc")
        //           .text()
        //           .trim();
        //         if (!title || !url) {
        //           resolve();
        //         } else {
        //           listPost.push({
        //             title,
        //             url,
        //             image: image ? image : null,
        //             time: null,
        //             description: description ? description : null,
        //           });
        //           resolve();
        //         }
        //       })
        //     );
        //   });
        //   $(".article").each((index, element) => {
        //     promises.push(
        //       new Promise(async (resolve) => {
        //         let title = $(element).find(".article-title > a").text().trim();
        //         let url = $(element).find("a").attr("href");
        //         let image = $(element).find("img").attr("src");
        //         // let time = $(element).find(".time").text().trim();
        //         // let description = $(element).find(".article-desc").text().trim();
        //         if (!title || !url) {
        //           resolve();
        //         } else {
        //           listPost.push({
        //             title,
        //             url,
        //             image: image ? image : null,
        //             time: null,
        //             description: null,
        //           });
        //           resolve();
        //         }
        //       })
        //     );
        //   });
        //   break;
        // case "https://doanhnghiepkinhdoanh.doanhnhanvn.vn":
        //   $(".position-relative").each((index, element) => {
        //     promises.push(
        //       new Promise(async (resolve) => {
        //         let title = $(element).find("a.title-link").text().trim();
        //         let url = $(element).find("a").attr("href");
        //         let image = $(element).find("img").attr("src");
        //         let time = $(element).find("small").text().trim();
        //         let description = $(element).find(".sapo").text().trim();
        //         listPost.push({
        //           title,
        //           url,
        //           image,
        //           time,
        //           description,
        //         });
        //         resolve();
        //       })
        //     );
        //   });
        //   $(".news-lg").each((index, element) => {
        //     promises.push(
        //       new Promise(async (resolve) => {
        //         let title = $(element).find(".text-secondary").text().trim();
        //         let url = $(element).find("a").attr("href");
        //         let image = $(element).find("img").attr("src");
        //         let time = $(element).find("small").text().trim();
        //         let description = $(element).find(".m-0").text().trim();
        //         listPost.push({
        //           title,
        //           url,
        //           image,
        //           time,
        //           description,
        //         });
        //         resolve();
        //       })
        //     );
        //   });
        //   $(".small-item").each((index, element) => {
        //     promises.push(
        //       new Promise(async (resolve) => {
        //         let title = $(element).find("a.text-secondary").text().trim();
        //         let url = $(element).find("a").attr("href");
        //         let image = $(element).find("img").attr("src");
        //         let time = $(element).find("small").text().trim();
        //         //   let description = $(element).find(".sapo").text().trim();
        //         listPost.push({
        //           title,
        //           url,
        //           image,
        //           time,
        //           description: null,
        //         });
        //         resolve();
        //       })
        //     );
        //   });
        //   break;
        // case "https://doanhnhanvn.vn":
        //   $(".story--highlight").each((index, element) => {
        //     promises.push(
        //       new Promise(async (resolve) => {
        //         let title = $(element).find(".story__title > a").text().trim();
        //         let url = $(element).find("a").attr("href");
        //         let image = $(element).find("img").attr("src");
        //         let time = $(element).find("time").text().trim();
        //         // let description = $(element).find("p").text().trim();
        //         listPost.push({
        //           title,
        //           url,
        //           image,
        //           time,
        //           description: null,
        //         });
        //         resolve();
        //       })
        //     );
        //   });
        //   $(".story").each((index, element) => {
        //     promises.push(
        //       new Promise(async (resolve) => {
        //         let title = $(element).find(".story__title > a").text().trim();
        //         let url = $(element).find("a").attr("href");
        //         let image = $(element).find("img").attr("src");
        //         let time = $(element).find("time").text().trim();
        //         // let description = $(element).find("p").text().trim();
        //         listPost.push({
        //           title,
        //           url,
        //           image,
        //           time: time ? time : null,
        //           description: null,
        //         });
        //         resolve();
        //       })
        //     );
        //   });
        //   break;
        default:
          break;
      }
    } catch (error) {
      // console.log("error: ");
    }

    // Wait for all promises to resolve
    //   Promise.all(promises).then(() => {
    //     console.log("listPost: ", listPost);
    //     console.log("listPost.length: ", listPost.length);
    //   });
  };
  // await getListPost("https://doisongphapluat.com.vn/kinh-doanh-17.html");

  // await getListPost("https://www.qdnd.vn/kinh-te/tin-tuc");
  // await getListPost(
  //   "https://doanhnghiepkinhdoanh.doanhnhanvn.vn/kinh-te-quoc-te.htm"
  // );
  // await getListPost(
  //   "https://doanhnghiepkinhdoanh.doanhnhanvn.vn/tai-chinh-doanh-nghiep.htm"
  // );
  // await getListPost("https://doanhnghiepkinhdoanh.doanhnhanvn.vn/vi-mo.htm");
  // await getListPost(
  //   "https://doanhnghiepkinhdoanh.doanhnhanvn.vn/khoi-nghiep-sang-tao.htm"
  // );

  // await getListPost("https://chatluongvacuocsong.vn/doanh-nghiep--doanh-nhan/");
  // await getListPost("https://chatluongvacuocsong.vn/van-hoa-doi-song/");
  // await getListPost("https://chatluongvacuocsong.vn/kinh-te/");
  // await getListPost("https://chatluongvacuocsong.vn/tai-chinh-ngan-hang/");
  // await getListPost("https://chatluongvacuocsong.vn/bat-dong-san/");
  await getListPost("https://baochinhphu.vn/kinh-te/khoi-nghiep.htm");
  await getListPost("https://baochinhphu.vn/xa-hoi.htm");
  await getListPost("https://baochinhphu.vn/kinh-te/thi-truong.htm");
  await getListPost("https://baochinhphu.vn/kinh-te/ngan-hang.htm");
  await getListPost("https://baochinhphu.vn/kinh-te/chung-khoan.htm");
  await getListPost("https://doanhnhanvn.vn/the-gioi/kinh-te-quoc-te");
  // await getListPost("https://doanhnhanvn.vn/doanh-nhan/khoi-nghiep");
  // await getListPost("https://doanhnhanvn.vn/doanh-nhan/dau-an-nam-chau");
  // await getListPost("https://doanhnhanvn.vn/doanh-nhan/goc-nhin-doanh-nhan");
  // await getListPost("https://doanhnhanvn.vn/doanh-nhan/nha-lanh-dao");
  // await getListPost("https://doanhnhanvn.vn/doanh-nhan/cong-dong-doanh-nhan");
  // await getListPost("https://doanhnhanvn.vn/doanh-nhan/kien-thuc-quan-tri");
  // await getListPost("https://doanhnhanvn.vn/viet-nam/vi-mo");
  // await getListPost("https://doanhnhanvn.vn/tai-chinh/tien-te");
  // await getListPost("https://doanhnhanvn.vn/tai-chinh/ngan-hang");
  // await getListPost("https://doanhnhanvn.vn/tai-chinh/dich-vu-tai-chinh");
  // await getListPost(
  //   "https://doanhnhanvn.vn/doanh-nghiep/tai-chinh-doanh-nghiep"
  // );
  // await getListPost("https://doanhnhanvn.vn/doanh-nghiep/phat-trien-ben-vung");
  // await getListPost("https://doanhnhanvn.vn/doanh-nghiep/m-a");
  // await getListPost("https://doanhnhanvn.vn/doanh-nghiep/chuyen-dong");
  // await getListPost("https://doanhnhanvn.vn/dau-tu/chung-khoan");
  // await getListPost("https://doanhnhanvn.vn/dau-tu/bat-dong-san");

  // await getListPost("https://baochinhphu.vn");
  // await getListPost("https://chatluongvacuocsong.vn");
  // await getListPost("https://dautu.kinhtechungkhoan.vn");
  // await getListPost("https://doanhnghiepkinhdoanh.doanhnhanvn.vn");
  // await getListPost("https://doanhnhanvn.vn");

  // console.log("All posts collected: ", listPost.length);
  //   console.log(listPost);

  //remove duplicate posts base on title
  let uniqueListPost = [];
  let uniqueTitles = [];
  listPost.forEach((post) => {
    if (!uniqueTitles.includes(post.title)) {
      uniqueListPost.push(post);
      uniqueTitles.push(post.title);
    }
  });
  // console.log("Unique posts: ", uniqueListPost.length);

  let uniqueListPostMap = uniqueListPost.map((item) => {
    return [null, ...Object.values(item), moment().format("YYYY-MM-DD")];
  });
  // console.log("uniqueListPostMap: ", uniqueListPostMap);

  //delete old data
  await queryMySQL(
    "DELETE FROM news_all where (date = ? OR date = ? OR date = ?) ",
    // "SELECT * FROM news_all where url LIKE '%https://baochinhphu.vn%' AND (date = ? OR date = ?) ",
    [
      moment().format("YYYY-MM-DD"),
      moment().subtract(1, "days").format("YYYY-MM-DD"),
      moment().subtract(2, "days").format("YYYY-MM-DD"),
    ]
  );
  //insert new data
  await queryMySQL(
    "INSERT INTO news_all (id, title, url, image, time, description, type, date) VALUES ?",
    [uniqueListPostMap]
  );
}

async function getNewsAllDetail() {
  console.log("[getNewsAllDetail] Executed");
  let listPost = [];
  const getListPost = async (sourceUrl) => {
    const response = await axios.get(sourceUrl);
    const html = response.data;
    const $ = cheerio.load(html);

    //   let listPost = [];
    let promises = [];

    try {
      switch (sourceUrl) {
        case "https://nguoiquansat.vn/bat-dong-san":
          $(".b-grid").each((index, element) => {
            let title = $(element).find(".b-grid__title").text().trim();
            let url = $(element).find("a").attr("href");
            let image = $(element).find("img").attr("src");
            let des1 = $(element).find(".b-grid__desc").text().trim();
            let des2 = $(element).find(".b-grid__row").text().trim();
            let object = {
              title: title,
              url: url,
              image: image,
              description: des1 ? des1 : des2,
              type: "Bất động sản",
            };
            listPost.push(object);
          });

          break;
        case "https://nguoiquansat.vn/tai-chinh-ngan-hang":
          $(".b-grid").each((index, element) => {
            let title = $(element).find(".b-grid__title").text().trim();
            let url = $(element).find("a").attr("href");
            let image = $(element).find("img").attr("src");
            let des1 = $(element).find(".b-grid__desc").text().trim();
            let des2 = $(element).find(".b-grid__row").text().trim();
            let object = {
              title: title,
              url: url,
              image: image,
              description: des1 ? des1 : des2,
              type: "Tài chính",
            };
            listPost.push(object);
          });

          break;
        case "https://nguoiquansat.vn/cong-nghe":
          $(".b-grid").each((index, element) => {
            let title = $(element).find(".b-grid__title").text().trim();
            let url = $(element).find("a").attr("href");
            let image = $(element).find("img").attr("src");
            let des1 = $(element).find(".b-grid__desc").text().trim();
            let des2 = $(element).find(".b-grid__row").text().trim();
            let object = {
              title: title,
              url: url,
              image: image,
              description: des1 ? des1 : des2,
              type: "Công nghệ",
            };
            listPost.push(object);
          });

          break;
        default:
          break;
      }
    } catch (error) {
      // console.log("error: ");
    }
  };

  await getListPost("https://nguoiquansat.vn/bat-dong-san");
  await getListPost("https://nguoiquansat.vn/tai-chinh-ngan-hang");
  await getListPost("https://nguoiquansat.vn/cong-nghe");

  //remove duplicate posts base on title
  let uniqueListPost = [];
  let uniqueTitles = [];
  listPost.forEach((post) => {
    if (!uniqueTitles.includes(post.title)) {
      uniqueListPost.push(post);
      uniqueTitles.push(post.title);
    }
  });

  //go to each url and get content
  let promises = [];
  uniqueListPost.forEach((post) => {
    promises.push(
      axios.get(post.url).then((response) => {
        const html = response.data;
        const $ = cheerio.load(html);

        let time = $(".block-sc-publish-time").text().trim();
        let header = $(".sc-longform-header-sapo").text().trim();
        let content = $("article").text().trim();
        let followedBy = $(".js-source-copy").text().trim();
        let sourceUrl = $("#url-copy").text().trim();

        // Lấy toàn bộ HTML bên trong .entry-no-padding (kể cả div, p, table,...)
        let entryHtml = $(".entry-no-padding").html();

        // Nếu bạn muốn lấy HTML của từng thẻ con (children) rồi ghép lại:
        // let entryHtml = $(".entry-no-padding").children().map((i, el) => {
        //   return $.html(el);
        // }).get().join("");
        // Xoá tất cả thẻ div nằm trong .entry-no-padding (bao gồm cả nội dung bên trong)
        let filteredHtml2 = $(".detail-content").html();
        // Xoá các thẻ div là con trực tiếp của .entry-no-padding
        $(".entry-no-padding > div").remove();

        // Sau khi xoá, lấy lại toàn bộ HTML bên trong .entry-no-padding
        let filteredHtml = $(".entry-no-padding").html();

        post.filteredHtml =
          filteredHtml?.trim()?.length > 100
            ? filteredHtml?.trim()
            : filteredHtml2?.trim();

        post.time = time;
        post.header = header;
        // post.content = content;
        post.followedBy = followedBy;
        post.sourceUrl = sourceUrl;

        // Lưu nội dung HTML vào post
        // post.entryHtml = entryHtml;
      })
    );
  });
  await Promise.all(promises);

  let uniqueListPostMap = uniqueListPost.map((item) => {
    return [null, ...Object.values(item), moment().format("YYYY-MM-DD")];
  });
  // console.log("uniqueListPostMap: ", uniqueListPostMap);

  //delete old data
  await queryMySQL(
    "DELETE FROM news_all_detail where (date = ? OR date = ? OR date = ?) ",
    [
      moment().format("YYYY-MM-DD"),
      moment().subtract(1, "days").format("YYYY-MM-DD"),
      moment().subtract(2, "days").format("YYYY-MM-DD"),
    ]
  );
  // console.log("uniqueListPostMap: ", uniqueListPostMap);
  //insert new data
  await queryMySQL(
    "INSERT INTO news_all_detail (id, title, url, image, description, type, filteredHtml, time, header, followedBy, sourceUrl, date) VALUES ?",
    [uniqueListPostMap]
  );
}

module.exports = {
  getNewsAll,
  getNewsAllDetail,
};
