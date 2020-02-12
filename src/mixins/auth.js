/**
 * Mixin regarding authentication related properties and methods.
 */

import _ from "lodash"

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
      if (!this.user) {
        return null
      }
      let uris = [this.user.uri].concat(Object.values(this.user.identities).map(identity => identity.uri)).filter(uri => uri != null)
      return uris
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
