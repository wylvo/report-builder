import sql from "mssql";

const sqlConfig = {
  server: "192.168.2.17\\SQLEXPRESS",
  database: process.env.DB_NAME,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  // options: {
  //   encrypt: true, // for azure
  //   trustServerCertificate: false, // change to true for local dev / self-signed certs
  // },
};

const connectToDB = async () => {
  try {
    // make sure that any items are correctly URL encoded in the connection string
    await sql.connect(sqlConfig);
    const result = await sql.query(`select * from reports`);
    console.dir(result);
    console.log(result);
  } catch (err) {
    console.error(err);
  }
};

connectToDB();
