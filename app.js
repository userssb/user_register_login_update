const express = require("express");
const app = express();
app.use(express.json());
const bcrypt = require("bcrypt");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "userData.db");

let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//register user API
app.post("/register", async (request, response) => {
  try {
    const { username, name, password, gender, location } = request.body;
    //console.log(password);
    const hashedPassword = await bcrypt.hash(password, 10);
    const selectUserQuery = `
        select * from user where username='${username}';
    `;
    const dbUser = await db.get(selectUserQuery);
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else if (dbUser === undefined) {
      //create user API
      const createUserQuery = `
        insert into user (username,name,password,gender,location)
        values('${username}','${name}','${hashedPassword}','${gender}','${location}');
        `;
      await db.run(createUserQuery);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("User already exists");
    }
  } catch (e) {
    console.log(`Error : ${e.message}`);
  }
});

//login user API
app.post("/login", async (request, response) => {
  try {
    const { username, password } = request.body;
    const selectUserQuery = `
        select * from user where username='${username}';
    `;
    const dbUser = await db.get(selectUserQuery);
    if (dbUser === undefined) {
      response.status(400);
      response.send("Invalid user");
    } else {
      isPasswordMatched = await bcrypt.compare(password, dbUser.password);
      if (isPasswordMatched === true) {
        response.status(200);
        response.send("Login success!");
      } else {
        response.status(400);
        response.send("Invalid password");
      }
    }
  } catch (e) {
    console.log(`Error : ${e.message}`);
  }
});

//Update password API
app.put("/change-password", async (request, response) => {
  try {
    const { username, oldPassword, newPassword } = request.body;
    const selectQuery = `
    select * from user where username='${username}'`;
    const dbUser = await db.get(selectQuery);
    if (dbUser === undefined) {
      response.status(400);
      response.send("Invalid username");
    } else {
      const isPasswordMatched = await bcrypt.compare(
        oldPassword,
        dbUser.password
      );
      if (isPasswordMatched) {
        if (newPassword.length > 4) {
          const newHashedPassword = await bcrypt.hash(newPassword, 10);
          const updateQuery = `
            update user set password='${newHashedPassword}'
            where username='${username}';
            `;
          const res = await db.run(updateQuery);
          response.status(200);
          response.send("Password updated");
        } else {
          response.status(400);
          response.send("Password is too short");
        }
      } else {
        response.status(400);
        response.send("Invalid current password");
      }
    }
  } catch (e) {
    console.log(`Error : ${e.message}`);
  }
});
