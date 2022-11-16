const fs = require('fs')
const path = require('path')
const puppeteer = require('puppeteer')

const file = path.join(__dirname, 'data/books.json')
const url = 'https://www.semana.com/buscador/?query=didier%20tavera';
(
  async () => {
    const browser = await puppeteer.launch({ headless: false })
    const page = await browser.newPage()
    await page.goto(url)
    const news = []
    let noticias = await page.$$('div.queryly_item_row')

    // console.log(btnNext)
    let btnNext = await page.$$('a.next_btn')

    do {
      btnNext = await page.$$('a.next_btn')
      noticias = await page.$$('div.queryly_item_row')
      for (const noticia of noticias) {
        const data = await noticia.evaluate(() => getInfoNews)
        console.log(data)
        news.push(data)
      }
      await page.waitForNavigation()
      await page.click('a.next_btn')
      console.log(noticias.length)
    } while (btnNext)

    // fs.writeFileSync(file, JSON.stringify(news), 'utf8')
    browser.close()
  })()

function getInfoNews () {
  const news = document.querySelector('.queryly_item_row')
  return {
    tittle: news.querySelector('div .queryly_item_title').textContent || '',
    url: news.querySelector('.queryly_item_row a').href || '',
    description: news.querySelector('.queryly_item_description').textContent || ''
  }
}
