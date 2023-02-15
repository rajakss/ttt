const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");
var format = require("date-fns/format");
var isValid = require("date-fns/isValid");
let db = null;

const a = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.get("/todos/", async (request, response) => {
  const {
    status,
    id,
    todo,
    category,
    priority,
    date,
    search_q,
  } = request.query;
  if (
    status !== undefined &&
    priority === undefined &&
    category === undefined
  ) {
    const query = `
        select * from todo where status='${status}'`;
    const r = await db.all(query);
    const rr = r.length;
    if (rr > 0) {
      response.send(r.map((ii) => a(ii)));
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  }
  if (
    priority !== undefined &&
    status === undefined &&
    category === undefined
  ) {
    const query = `select * from todo where priority=
      '${priority}'`;
    const r = await db.all(query);
    const rr = r.length;
    if (rr > 0) {
      response.send(r.map((ii) => a(ii)));
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  }
  if (
    status !== undefined &&
    priority !== undefined &&
    category === undefined
  ) {
    const q1 = `select * from todo where status='${status}'`;
    const r = await db.all(q1);
    const q2 = `select * from todo where priority='${priority}'`;
    const rr = await db.all(q2);
    if (r.length > 0 && rr.length > 0) {
      const query = `select * from todo where status='${status}'
           AND priority='${priority}'`;
      const m = await db.all(query);
      response.send(m.map((ii) => ii));
    } else if (r.length < 1) {
      response.status(400);
      response.send("Invalid Todo Status");
    } else if (rr.length < 1) {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  }
  if (search_q !== undefined && priority === undefined) {
    const query = `
        select * from todo where todo like '%${search_q}%'`;
    const r = await db.all(query);
    const rr = r.length;
    response.send(r.map((ii) => a(ii)));
  }
  if (status !== undefined && category !== undefined) {
    const q1 = `select * from todo where status='${status}'`;
    const r = await db.all(q1);
    const q2 = `select * from todo where category='${category}'`;
    const rr = await db.all(q2);
    if (r.length > 0 && rr.length > 0) {
      const query = `select * from todo where status='${status}'
           AND category='${category}'`;
      const m = await db.all(query);
      response.send(m.map((ii) => ii));
    } else if (r.length < 1) {
      response.status(400);
      response.send("Invalid Todo Status");
    } else if (rr.length < 1) {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  }
  if (
    category !== undefined &&
    status === undefined &&
    priority === undefined
  ) {
    const query = `select * from todo where category=
      '${category}'`;
    const r = await db.all(query);
    const rr = r.length;
    if (rr > 0) {
      response.send(r.map((ii) => a(ii)));
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  }
  if (category !== undefined && priority !== undefined) {
    const q1 = `select * from todo where priority='${priority}'`;
    const r = await db.all(q1);
    const q2 = `select * from todo where category='${category}'`;
    const rr = await db.all(q2);
    if (r.length > 0 && rr.length > 0) {
      const query = `select * from todo where priority='${priority}'
           AND category='${category}'`;
      const m = await db.all(query);
      response.send(m.map((ii) => ii));
    } else if (r.length < 1) {
      response.status(400);
      response.send("Invalid Todo Priority");
    } else if (rr.length < 1) {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const query = `
    select * from todo where id=${todoId}`;
  const r = await db.get(query);
  response.send(a(r));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (date === undefined) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const valid = isValid(new Date(date));
    if (valid) {
      const n_date = format(new Date(date), "yyyy-MM-dd");
      const query = `select * from todo where due_date = '${n_date}'`;
      const y = await db.all(query);
      response.send(y.map((ii) => a(ii)));
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, category, status, dueDate } = request.body;
  const query = `
    insert into todo(id,todo,priority,status,category,due_date)
    values(
        ${id},
        '${todo}',
        '${priority}',
        '${status}',
        '${category}',
        '${dueDate}'
    )`;
  await db.run(query);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { status, priority, todo, category, dueDate } = request.body;
  const todoId = request.params;
  if (status !== undefined) {
    const query = `
        UPDATE
        todo
        set
        status='${status}'
        where id='${todoId}'`;
    await db.run(query);
    response.send("Status Updated");
  }
  if (priority !== undefined) {
    const query = `
        UPDATE
        todo
        set
        priority='${priority}'
        where id='${todoId}'`;
    await db.run(query);
    response.send("Priority Updated");
  }
  if (todo !== undefined) {
    const query = `
        UPDATE
        todo
        set
        todo='${todo}'
        where id='${todoId}'`;
    await db.run(query);
    response.send("Todo Updated");
  }
  if (category !== undefined) {
    const query = `
        UPDATE
        todo
        set
        category='${category}'
        where id='${todoId}'`;
    await db.run(query);
    response.send("Category Updated");
  }
  if (dueDate !== undefined) {
    const valid = isValid(new Date(dueDate));
    if (valid) {
      const n_date = format(new Date(dueDate), "yyyy-MM-dd");
      const query = `
        update todo 
        set 
        due_date='${dueDate}'
        where id='${todoId}'`;
      await db.run(query);
      response.send("Due Date Updated");
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const y = `delete from todo
    where id='${todoId}'`;
  await db.run(y);
  response.send("Todo Deleted");
});

module.exports = app;
