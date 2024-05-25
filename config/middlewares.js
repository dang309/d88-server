module.exports = [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        directives: {
          'default-src': ['self'],
          'img-src': ['self', 'data:', '35.219.140.164'],
          'script-src': ['self', '35.219.140.164'],
          'frame-src': ['none'],
          // Add other directives as needed
        },
      },
    }
  },
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
