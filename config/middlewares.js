module.exports = [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        directives: {
          'default-src': ['self'],
          'img-src': ['self', 'data:', 'https://danguyen.site'],
          'script-src': ['self', 'https://danguyen.site'],
          'frame-src': ['none'],
        },
      },
    }
  },
  {
    name: 'strapi::cors',
    config: {
      header: '*',
      origin: ['http://localhost:3030', 'https://d88-bet.vercel.app']
    }
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
