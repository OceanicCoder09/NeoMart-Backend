import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { seedDatabase } from "./seeds/products.js";
import productRoutes from "./routes/productRoutes.js";
import { sql } from "./config/db.js";
import bcrypt from "bcrypt";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Fix __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(cors());

// API Routes
app.use("/api/products", productRoutes);

// DB Initialization
async function initDB() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        image VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log("Database initialized successfully");
  } catch (error) {
    console.log("Error initDB", error);
  }
}

app.post("/api/signup", async (req, res)=>{
  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await sql`
      INSERT INTO users (username, password)
      VALUES (${username}, ${hashedPassword})
      RETURNING id, username`;
      res.status(201).json({id: result[0].id, username: result[0].username});
      console.log("User created successfully");
  } catch (error) {
    res.status(500).json({ error: "Error creating user" });
    console.error("Error creating user", error);  
  }
})

app.post("/api/login", async (req, res)=>{
  const { username, password } = req.body;
  try {
    const result = await sql`
      SELECT * FROM users WHERE username = ${username}
    `;
    if (result.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    const user = result[0];
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    res.status(200).json({ id: user.id, username: user.username });
  } catch (error) {
    res.status(500).json({ error: "Error logging in" });
    console.error("Error logging in", error);
  }
})
// Run server after DB setup
initDB().then(() => {
  // seedDatabase(); // Only seed after table is created

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
