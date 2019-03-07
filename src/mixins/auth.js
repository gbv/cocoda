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
      return this.$util.prefLabel(this.creator, null, false)
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
      let result = null
      _.forEach((this.user && this.user.identities) || {}, (identity, providerId) => {
        let provider = this.providers.find(provider => provider.id === providerId)
        if (this.creator.uri === identity.uri && provider) {
          result = provider
        }
      })
      return result
    },
    authorized() {
      return _.get(this, "$store.state.auth.authorized")
    },
  },
  methods: {
    setName(name) {
      return this.$store.dispatch("auth/setName", name)
    },
  },
}
