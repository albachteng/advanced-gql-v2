const { ApolloServer, AuthenticationError, UserInputError, ApolloError } = require('apollo-server')
const typeDefs = require('./typedefs')
const resolvers = require('./resolvers')
const {createToken, getUserFromToken} = require('./auth')
const db = require('./db')
const { AuthenticationDirective, AuthorizationDirective } = require('./directives')

const server = new ApolloServer({
  typeDefs,
  resolvers,
  schemaDirectives: {
    authentication: AuthenticationDirective,
    authorization: AuthorizationDirective
  }, 
  context({req, connection}) {
    const context = {...db}
    if (connection) {
      console.log({context})
      return {...context, ...connection.context}
    }
    const token = req.headers.authorization
    console.log({token})
    const user = getUserFromToken(token)
    return {...context, user, createToken}
  },
  subscriptions: {
    onConnect(params) {
      // useful to distinguish authorization from authToken
      // you need it to post the message but you also need one to subscribe
      const token = params?.authentication
      const user = getUserFromToken(token)
      console.log('from subscription', {token})
      if (!user) throw new AuthenticationError('not authenticated, you fool!')
      return {user}
    }
  }
})

server.listen(4000).then(({url}) => {
  console.log(`🚀 Server ready at ${url}`)
})
