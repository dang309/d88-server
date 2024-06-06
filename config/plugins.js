module.exports = () => ({
  transformer: {
    enabled: true,
    config: {
      responseTransforms: {
        removeAttributesKey: true,
        removeDataKey: true,
      },
    },
  },
  "users-permissions": {
    config: {
      register: {
        allowedFields: ["avatarUrl"],
      },
      jwt: {
        expiresIn: '3 months'
      }
    },
  },
});
