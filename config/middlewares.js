module.exports = [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        directives: {
          'default-src': ['self'],
          'img-src': ['self', 'data:', 'http://35.219.140.164:1337'],
          'script-src': ['self', 'http://35.219.140.164:1337'],
          'frame-src': ['none'],
          // Add other directives as needed
        },
      },
    }
  },
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      header: '*',
      origin: ['http://localhost:3030', 'https://d88-cient.vercel.app']
    }
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
