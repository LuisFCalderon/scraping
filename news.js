const { isAfter } = require('date-fns')
const puppeteer = require('puppeteer')
const path = require('path')
const fs = require('fs')
const axios = require('axios')
const baseURL = 'https://www.fnd.org.co/sala-de-prensa/sala-de-prensa.html?start={{OFFSET}}'
const slugify = require('slugify')

const file = path.join(__dirname, 'data', 'news.json')
const startDate = new Date(2019, 9, 1);

(async () => {
  try {
    const browser = await puppeteer.launch(/* { headless: false } */)
    const page = await browser.newPage()

    // Get urls to visit
    const urls = []
    const images = []
    const pageSize = 13
    let currentPage = 1
    let collect = true

    console.log('Obtaining URLs...')
    while (collect) {
      await page.goto(baseURL.replace('{{OFFSET}}', pageSize * (currentPage - 1)))
      const data = await page.evaluate(() => {
        const articles = Array.from(document.querySelectorAll('[data-permalink]'))
        const time = articles[articles.length - 1].querySelector('time')

        const images = articles.map(article => {
          const src = article.querySelector('img.uk-invisible')?.src ?? ''
          const ext = src.slice(src.lastIndexOf('.') + 1)
          const title = article.querySelector('h1.uk-article-title')?.textContent ?? ''
          return {
            src,
            title,
            ext
          }
        })

        return {
          permalinks: articles.map(element => element.dataset.permalink),
          lastDate: time.getAttribute('datetime'),
          images
        }
      })
      urls.push(...data.permalinks)
      images.push(...data.images.map(image => ({
        ...image,
        title: `${slugify(image.title, { lower: true })}.${image.ext}`
      })))
      collect = isAfter(new Date(data.lastDate), startDate)
      currentPage += 1
    }
    console.log('Done ✓')
    console.log('\n')

    const results = []
    const total = urls.length
    let missing = 0
    let warnings = 0

    for (let index = 0; index < total; index++) {
      console.log(`Processing ${index + 1} / ${total}`)
      const url = urls[index]
      const response = await page.goto(url, {
        timeout: 60000
      })
      if (response.status() === 404) {
        missing += 1
        console.log('Not found X')
        console.log('\n')
        continue
      }
      const data = await page.evaluate(() => {
        const title = document.querySelector('h1.uk-article-title')?.textContent ?? ''
        const time = document.querySelector('time')
        const articleBody = document.querySelector('.article-body')
        const articleBodyChildren = Array.from(articleBody.children)
        const author = articleBody.firstElementChild.textContent.replace('Por:', '').trim()

        articleBodyChildren.shift()

        const content = articleBodyChildren.reduce((result, tag) => {
          tag.removeAttribute('style')
          return result + tag.outerHTML
        }, '')

        return {
          title: title.trim(),
          date: time?.getAttribute('datetime') ?? '',
          author,
          content
        }
      })
      if (!data.title) {
        console.log('I could\'t find the title 🤔')
        console.log('\n')
        warnings += 1
        continue
      }

      // Download images 👀
      const image = images[index]
      if (image.src) {
        const imagePath = path.join(__dirname, 'images', image.title)
        if (!fs.existsSync(imagePath)) {
          const imgResponse = await axios.get(image.src, {
            responseType: 'stream'
          })
          imgResponse.data.pipe(fs.createWriteStream(imagePath))
        }
      }

      results.push(data)
      console.log('Processed ✓')
      console.log('\n')
    }

    await browser.close()
    fs.writeFileSync(file, JSON.stringify(results), 'utf8')
    console.log(`✓ ${results.length} entries saved`)
    console.log(`⚠ ${warnings} entries omitted because title is missing`)
    console.log(`X ${missing} missing pages`)
    console.log('\n')
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
})()
