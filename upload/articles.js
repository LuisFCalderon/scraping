const slugify = require('slugify')
const data = require('../data/articles.json')
const axios = require('axios')

async function run () {
  for (let i = 0; i < data.length; i++) {
    const item = data[i]
    const slug = slugify(item.title, { lower: true, strict: true })
    const body = {
      slug,
      title: item.title,
      excerpt: item.excerpt,
      author: 'Didier Tavera Amado',
      publishedDate: item.publishedDate,
      content: item.content,
      postedAt: item.link
    }

    const res = await axios.post('http://localhost:1337/api/directors-columns', { data: body })
    console.log(res.data.data.id)
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
