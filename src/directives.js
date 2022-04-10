const { SchemaDirectiveVisitor, AuthenticationError } = require('apollo-server')
const { defaultFieldResolver, GraphQLString, visitFieldDefinition } = require('graphql')
const {formatDate} = require('./utils')


class AuthenticationDirective extends SchemaDirectiveVisitor {
    visitFieldDefinition(field) {
        const resolver = field.resolve || defaultFieldResolver;
        field.resolve = async (root, args, ctx, info) => {
            if (!ctx.user) throw new AuthenticationError("Not authenticated - log in");
            return resolver(root, args, ctx, info);
        }
    }
}

class AuthorizationDirective extends SchemaDirectiveVisitor {
    visitFieldDefinition(field) {
        const { role } = this.args;
        const resolver = field.resolve || defaultFieldResolver;
        field.resolve = async (root, args, ctx, info) => {
            if (role !== ctx.user.role) throw new AuthenticationError(`Not authorized - must be ${role}`);
            return resolver(root, args, ctx, info);
        }
    }
}

module.exports = {
    AuthorizationDirective,
    AuthenticationDirective, 
}