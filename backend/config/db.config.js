const dbConfig = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  trustServerCertificate: true,
  parseJSON: true,
  // options: {
  //   encrypt: true, // for azure
  //   trustServerCertificate: false, // change to true for local dev / self-signed certs
  // },
};

export default dbConfig;
