import mysql from "mysql2/promise";

export const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "root",
  database: "andon_db",
  waitForConnections: true,
  connectionLimit: 10,
});

export async function testDB() {
  try {
    const connection = await db.getConnection();
    const [rows] = await connection.query("SELECT DATABASE() as db");
    console.log(rows);

    console.log("Connected to MySQL!");
    // await connection.end();
  } catch (err) {
    console.error("MySQL connection failed:", err);
  }
}
