const fs = require('fs/promises')
const path = require('path')
const slugify = require('slugify')
const data = require('../data/news.json')
const FormData = require('form-data')
const axios = require('axios')

const imagesFolder = path.resolve(__dirname, '..', 'images')

async function getImage (filename) {
  const buf = await fs.readFile(path.resolve(__dirname, '..', 'images', filename))
  return buf
}

async function run () {
  const allImages = await fs.readdir(imagesFolder)
  for (let i = 0; i < data.length; i++) {
    const item = data[i]
    const slug = slugify(item.title, { lower: true })
    const body = {
      title: item.title,
      author: 'Prensa FND',
      publishedDate: item.date,
      content: item.content,
      slug
    }

    const form = new FormData()
    form.append('data', JSON.stringify(body))

    const re = new RegExp(slug + '\\.jpe?g')
    const image = allImages.find(imageURL => re.test(imageURL))

    if (image) {
      const imageContent = await getImage(image)
      form.append('files.cover', imageContent, image)
    }

    const res = await axios.post('http://localhost:1337/api/news', form, {
      headers: form.getHeaders()
    })
    console.log(res.data)
    console.log('*********')
  }
}

run().catch(error => {
  if (error.response) {
    console.error(error.response)
  } else {
    console.error(error)
  }
  process.exit(1)
})
