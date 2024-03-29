/**
 * Mixin regarding authentication related properties and methods.
 */

import _ from "lodash"
import { userUris } from "@/utils"

export default {
  computed: {
    creator() {
      return this.$store.getters["creator"]
    },
    creatorName() {
      return this.$jskos.prefLabel(this.creator, { fallbackToUri: false })
    },
    userName() {
      return this.$settings.creator
    },
    user() {
      return _.get(this, "$store.state.auth.user")
    },
    providers() {
      return _.get(this, "$store.state.auth.providers")
    },
    userUris() {
      return userUris(this.user)
    },
    userIdentityImage() {
      if (this.userIdentityProvider && this.userIdentityProvider.image) {
        return this.userIdentityProvider.image
      }
    },
    userIdentityProvider() {
      return this.providerForIdentityUri(this.creator.uri)
    },
    authorized() {
      return _.get(this, "$store.state.auth.authorized")
    },
  },
  methods: {
    setName(name) {
      return this.$store.dispatch("auth/setName", name)
    },
    getNameForIdentity(uri) {
      if (!uri) {
        // Get URI from creator or default to first identity in user
        if (this.creator.uri) {
          uri = this.creator.uri
        } else {
          uri = this.userUris && this.userUris[0]
        }
      }
      if (!this.user || !uri) {
        return null
      }
      const identity = Object.values(this.user.identities || {}).find(i => i.uri === uri)
      if (identity) {
        return identity.name
      }
      return this.user.name
    },
    providerForIdentityUri(uri) {
      let result = null
      _.forEach((this.user && this.user.identities) || {}, (identity, providerId) => {
        let provider = this.providers.find(provider => provider.id === providerId)
        if (uri === identity.uri && provider) {
          result = provider
        }
      })
      return result
    },
    imageForIdentityUri(uri) {
      let provider = this.providerForIdentityUri(uri)
      if (provider && provider.image) {
        return provider.image
      }
      return null
    },
  },
}
