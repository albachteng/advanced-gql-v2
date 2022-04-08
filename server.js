const gql = require('graphql-tag');
const { ApolloServer, PubSub, SchemaDirectiveVisitor } = require('apollo-server');
const { defaultFieldResolver, GraphQLString } = require('graphql')

const pubSub = new PubSub();
const NEW_ITEM = 'NEW_ITEM';

class LogDirective extends SchemaDirectiveVisitor {
    visitFieldDefinition(field) {
        console.log(field);
        const resolver = field.resolve || defaultFieldResolver; 
        const { message } = this.args;
        console.log("before: ", message)
        field.args.push({
            type: GraphQLString,
            name: 'message'
        })

        field.resolve = (root, {message, ...args}, ctx, info) => {
            console.log('after: ', message);
            return resolver.call(this, root, args, ctx, info)
        }
    }
}

const typeDefs = gql`
    directive @log(message: String = "my message (default from directive def)") on FIELD_DEFINITION

    type User {
        id: ID! @log(message: "not default (from id field typedefs)")
        error: String! @deprecated
        username: String! @log
        createdAt: Int!
    }

    type Settings {
        user: User!
        theme: String!
    }

    type Item {
        task: String!
    }

    input NewSettingsInput {
        user: ID!
        theme: String!
    }

    type Query {
        me: User!
        settings(user: ID!): Settings!
    }

    type Mutation {
        settings(input: NewSettingsInput!): Settings!
        createItem(task: String!): Item!
    }

    type Subscription {
        newItem: Item        
    }
`

const resolvers = {
    Query: {
        me() {
            return {
                id: '21113143',
                username: 'dannyboi',
                createdAt: 374958495
            }
        },
        settings(_, {user}) {
            return {
                user, 
                theme: 'Light'
            }
        }
    },
    Mutation: {
        settings(_, {input}) {
            return input;
        },
        createItem(_, {task}) {
            const item = {task}
            pubSub.publish(NEW_ITEM, {newItem: item})
            return item  
        }
    },

    Subscription: {
        newItem: {
            subscribe: () => pubSub.asyncIterator(NEW_ITEM)
        }
    },

    Settings: {
        user() {
            return {
                id: '21113143',
                username: 'dannyboi',
                createdAt: 374958495
            }
        }
    }
}

const server = new ApolloServer({
    typeDefs,
    resolvers,
    schemaDirectives: {
        log: LogDirective
    }, 
    // formatError: (e) => {
    //     console.log(e)
    //     return new Error('mine, not yours');
    // },
    context({connection, req}) {
        if (connection) {
            return {...connection.context}
        }
    },
    subscriptions: {
        onConnect(params) {

        }
    }
});

server.listen().then(({url}) => console.log(`server running at ${url}`));