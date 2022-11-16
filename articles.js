const puppeteer = require('puppeteer')
const fs = require('fs')
const path = require('path')

const file = path.join(__dirname, 'news.json');

(
  async () => {
    const url = 'https://www.semana.com/buscador/?query=didier%20tavera'
    const browser = await puppeteer.launch(/* { headless: false } */)
    const page = await browser.newPage()
    await page.goto(url)
    let news = []
    let noticias = await page.$$('div.queryly_item_row')
    let id = 0
    let btnNext = await page.$('a.next_btn')

    while (btnNext) {
      btnNext = await page.$('a.next_btn')
      if (btnNext) {
        noticias = await page.$$('div.queryly_item_row')
        for (let i = 0; i < noticias.length; i++) {
          const data = await noticias[i].evaluate((element) => {
            const news = element
            return {
              tittle: news.querySelector('.queryly_item_title').textContent || '',
              date: news.querySelector('a div').textContent || '',
              url: news.querySelector('a').href || '',
              description: news.querySelector('.queryly_item_description').textContent || ''
            }
          })
          const { url } = data
          const pageArticle = await browser.newPage()
          await pageArticle.goto(url)
          const article = await pageArticle.$('div.section.sp-12')
          const content = await article.evaluate(() => {
            const header = document.querySelector('.article-header-box')
            const article = document.querySelector('.paywall').innerHTML
            return {
              abstract: header.querySelector('h2').textContent || '',
              date: header.querySelector('.datetime').textContent || '',
              article

            }
          })
          console.log(content)
          news = [...news, { id, ...data, ...content }]
          await pageArticle.close()

          id++
        }
        await page.waitForTimeout(2000)
        await page.click('a.next_btn')
      }
    }
    fs.writeFileSync(file, JSON.stringify(news), 'utf8')
    browser.close()
  })()
