const axios = require("axios");
const cheerio = require("cheerio");
const { createObjectCsvWriter } = require("csv-writer");
const links = require("./links"); // Импортируем список страниц из links.js

// Функция для задержки
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const domen = "https://www.mkslift.ru";
const delayTime = 1500; // Задержка между запросами в миллисекундах

(async () => {
  try {
    const products = [];
    let processedCount = 0; // Счетчик обработанных URL

    for (let link of links) {
      const { data } = await axios.get(link);

      const $ = cheerio.load(data);

      const getText = (selector) => $(selector).text().trim() || null;
      const getAttr = (selector, attr) => $(selector).attr(attr) || null;

      const title = getText("h1");
      const description = getText("#description-pane");
      const minDescription = getText(".description-short p");
      const garanty = getText(".list-unstyled.small h5");
      const price = getText(
        ".col-xs-12.col-sm-12.col-md-6 .btn-toolbar .btn-group.price big"
      );
      const imageUrlOsn = domen + getAttr(".fancybox-thumb", "href");
      const linkYouTube = getAttr(
        ".table.table-condensed noindex iframe",
        "src"
      );
      // Переменные для хранения изображений
      let imageUrlOne = null;
      let imageUrlTwo = null;

      // Обходим каждый элемент img и проверяем содержимое
      $(".col-xs-12.col-sm-6.col-md-5.col-lg-5 .img img").each(
        (index, element) => {
          const src = $(element).attr("src");

          // Если src не содержит слова "example", берем элемент
          if (!src.includes("saleredribbon")) {
            if (!imageUrlOne) {
              imageUrlOne = domen + src;
            } else if (!imageUrlTwo) {
              imageUrlTwo = domen + src;
            }
          }
        }
      );

      const imageUrlDop =
        $(".mkslift-gallery")
          .map((_, el) => domen + $(el).attr("big_img"))
          .toArray()
          .join(", ") || null;

      const fileUrl =
        $("#files-pane .btn.btn-block.btn-primary")
          .map((_, el) => $(el).attr("href"))
          .toArray()
          .join(", ") || null;

      const associatedProducts =
        $(".table.table-condensed i.art-value")
          .map((_, el) => $(el).text().trim())
          .toArray()
          .join(", ") || null;

      const category =
        $(".view-single.clearfix.thumbnail a")
          .map((_, el) => $(el).text().trim())
          .toArray()
          .join(" > ")
          .trim() || null;

      const artikul = getText(".btn-group.articul b");
      const atribut1 = getText(".btn-group.articul span span a");

      const getAtribut = (index) => {
        const name = getText(`#options-pane tr:eq(${index}) td:eq(0)`);
        const value = getText(`#options-pane tr:eq(${index}) td:eq(1)`);
        return { name, value };
      };

      const atributs = Array.from({ length: 21 }, (_, i) => getAtribut(i));

      const product = {
        title,
        description,
        price,
        imageUrlOsn,
        imageUrlDop,
        artikul,
        minDescription,
        linkYouTube,
        fileUrl,
        garanty,
        associatedProducts,
        category,
        atribut1,
        imageUrlOne,
        imageUrlTwo,
      };

      atributs.forEach((atribut, index) => {
        product[`atributName${index + 2}`] = atribut.name;
        product[`atributZnach${index + 2}`] = atribut.value;
      });

      products.push(product);

      // Увеличиваем счетчик и выводим количество обработанных URL
      processedCount++;
      console.log(`Обработано URL: ${processedCount} из ${links.length}`);

      // Задержка между запросами
      await delay(delayTime);
    }

    const csvWriter = createObjectCsvWriter({
      path: "products.csv",
      header: [
        { id: "title", title: "Имя" },
        { id: "category", title: "Категории" },
        { id: "description", title: "Описание" },
        { id: "minDescription", title: "Краткое описание" },
        { id: "price", title: "Цена" },
        { id: "imageUrlOsn", title: "Изображения" },
        { id: "imageUrlDop", title: "Изображения" },
        { id: "imageUrlOne", title: "Изображения" },
        { id: "imageUrlTwo", title: "Изображения" },
        { id: "artikul", title: "Артикул" },
        { id: "linkYouTube", title: "video_youtube" },
        { id: "fileUrl", title: "pdf_instruction" },
        { id: "garanty", title: "Значения атрибутов 2" },
        { id: "associatedProducts", title: "tovar_articul_product" },
        { id: "atribut1", title: "Значения атрибутов 1" },
        ...Array.from({ length: 20 }, (_, i) => [
          { id: `atributName${i + 2}`, title: `Название атрибута ${i + 3}` },
          { id: `atributZnach${i + 2}`, title: `Значения атрибутов ${i + 3}` },
        ]).flat(),
      ],
    });

    await csvWriter.writeRecords(products);
    console.log("The CSV file was written successfully");
  } catch (error) {
    console.error("Error fetching data:", error);
  }
})();
