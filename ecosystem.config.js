module.exports = {
  apps: [
    {
      name: 'd88', // Your project name
      script: './server.js',
      cwd: '/home/hada_nguyen309/d88-server', // Path to your project
      script: 'yarn', // For this example we're using npm, could also be yarn
      args: 'start', // Script to start the Strapi server, `start` by default
      env: {
        APP_KEYS: '/uuXsSkovodWEFDHdtiwFw==,MS8gLekmhEaOih8VtF4X4Q==,FlxnpbB6nsCJCZPPknsHrQ==,3COH/VGV203fsXNa0UaSww==', // you can find it in your project .env file.
        API_TOKEN_SALT: '7mmPIdfjKEXqRjFFZK//Qw==',
        ADMIN_JWT_SECRET: 'iG/B07+rHldGLHoj5K2K5w==',
        JWT_SECRET: 'KoScorE3F7kWXZ/Aj1Eorw==',
        NODE_ENV: 'production',
        DATABASE_HOST: '127.0.0.1', // database Endpoint under 'Connectivity & Security' tab
        DATABASE_PORT: '3306',
        DATABASE_NAME: 'd88', // DB name under 'Configuration' tab
        DATABASE_USERNAME: 'dangn', // default username
        DATABASE_PASSWORD: '@@HaiDang309@@'
      },
    },
  ],
};
