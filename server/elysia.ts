import { createElysiaApp } from './elysia-app'

const apiPort = parseInt(process.env.API_PORT || '4000', 10)

const app = createElysiaApp('/api')

app.listen(apiPort, () => {
})
