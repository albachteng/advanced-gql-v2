const { ApolloServer, AuthenticationError, UserInputError, ApolloError } = require('apollo-server')
const typeDefs = require('./typedefs')
const resolvers = require('./resolvers')
const {createToken, getUserFromToken} = require('./auth')
const db = require('./db')

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context({req, connection}) {
    const context = {...db}
    if (connection) {
      return {...context, ...connection.context}
    }
    const token = req.headers.authorization
    const user = getUserFromToken(token)
    return {...context, user, createToken}
  },
  subscriptions: {
    onConnect(params) {
      // useful to distinguish authorization from authToken
      // you need it to post the message but you also need one to subscribe
      const token = params.authToken
      const user = getUserFromToken(token)
      if (!user) throw new AuthenticationError('not authenticated, you fool!')
      return {user}
    }
  }
})

server.listen(4000).then(({url}) => {
  console.log(`🚀 Server ready at ${url}`)
})
