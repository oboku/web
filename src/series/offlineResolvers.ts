import { generateUniqueID, getMainDefinition } from "../utils";
import { ApolloClient } from "@apollo/client";
import { MutationEditSeriesArgs, MutationRemoveSeriesArgs, Query_One_Series_Document, QuerySeriesIdsDocument } from "../generated/graphql";
import { useClient } from "../client";

export declare type IResolverObject<TContext = any, TArgs = any> = {
  [key: string]: IFieldResolver<TContext, TArgs>
};

export type IFieldResolver<TContext, TArgs = Record<string, any>> = (args: TArgs, context: TContext) => any;

type ResolverContext = { client: NonNullable<ReturnType<typeof useClient>> }

export const seriesOfflineResolvers = {
  Mutation: {
    addSeries: (variables: { name: string }, { client }: ResolverContext) => {
      const series = {
        __typename: 'Series' as const,
        id: generateUniqueID(),
        books: [],
        ...variables,
      }

      // create the offline item reference
      client.cache.writeQuery({
        query: Query_One_Series_Document,
        variables: { id: series.id },
        data: { oneSeries: series },
      })
      // add the offline item to the list
      client.cache.modify({
        fields: {
          series: (prev = [], { toReference }) => {
            return [...prev, toReference(series)]
          }
        }
      })

      return series
    },
    removeSeries: ({ id }: MutationRemoveSeriesArgs, { client }: ResolverContext) => {
      const normalizedId = client.cache.identify({ id, __typename: 'Series' })
      if (normalizedId) {
        client.cache.evict({ id: normalizedId })
        client.evictRootQuery({ fieldName: 'oneSeries', args: { id } })
        const data = client.readQuery({ query: QuerySeriesIdsDocument })
        data && client.writeQuery({ query: QuerySeriesIdsDocument, data: { series: data?.series?.filter(item => item?.id !== id) } })
      }
    },
    editSeries: ({ id, name }: MutationEditSeriesArgs, { client }: ResolverContext) => {
      client.cache.modify({
        id: client.cache.identify({ id, __typename: 'Series' }),
        fields: {
          name: (prev) => name || prev,
        }
      })
    },
  },
}