var db_ops = require("./database/operations.js");
var utils = require("./utilities/utils.js");
var express = require("express");
var session = require("express-session");
var bodyParser = require("body-parser");
var url = require("url");

const MAX_EPISODE_VALUE = 9999;
const PORT = process.env.PORT || 90;

let sess = null;
var app = express();
app.set("views", __dirname + "/views");
app.engine("html", require("ejs").renderFile);
app.use(
    session({
        secret: "new-session"
    })
);
app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true
    })
);
app.use(express.static("views"));

app.listen(PORT, function() {
    console.log("App Started on PORT " + PORT);
});

app.get("/", function(req, res) {
    if (null == sess) {
        res.render("landing.html");
    } else {
        res.render("home.html");
    }

    res.end();
});

app.get("/retrieve", async function(req, res) {
    if (null == sess) {
        res.status(401); // Unauthorized
        res.end();
        return;
    }

    res.writeHead(200, {
        "Content-Type": "text/json"
    });

    const params = url.parse(req.url, true).query;

    if ("watchlist" == params.data) {
        let query = {
            owner: sess.user_id
        };
        let item = await db_ops.queryItem("watchlist", query);

        res.write(JSON.stringify(item));
        res.end();
    } else if ("session" == params.data) {
        let user = { name: sess.username, email: sess.email };
        res.write(JSON.stringify(user));
        res.end();
    } else {
        console.log("Default behavior for unset data param.");
        res.send("");
        res.end();
    }
});

app.put("/episode", async function(req, res) {
    if (null == sess) {
        res.status(401); // Unauthorized
        res.end();
        return;
    }

    const params = req.body;
    let status = { error: "" };
    if (isNaN(params.episode) || undefined == params.id) {
        status.error = "Invalid episode update requested";
        res.status(400); // Bad Request
        res.json(status);
        return;
    }
    const newEpisode = parseInt(params.episode);
    if (0 >= newEpisode) {
        res.status(400);
        status.error = "Last watched episode cannot be lower than 1";
        res.json(status);
        res.end();
        return;
    }

    if (newEpisode > MAX_EPISODE_VALUE) {
        res.status(400);
        status.error = "Last watched episode is too high!";
        res.json(status);
        res.end();
        return;
    }

    let query = { owner: sess.user_id, _id: db_ops.ObjectId(params.id) };
    let updatedItem = { $set: { episode: newEpisode, last_update: utils.getFullDate() } };
    await db_ops.updateItem("watchlist", query, updatedItem);

    res.status(200); // OK
    res.end();
});

app.get("/show", async function(req, res) {
    if (null == sess) {
        res.status(401); // Unauthorized
        res.end();
        return;
    }
});

app.put("/show", async function(req, res) {
    if (null == sess) {
        res.status(401); // Unauthorized
        res.end();
        return;
    }

    const params = req.body;

    // not a number
    if (isNaN(params.episode)) {
        res.status(400); // server error
        res.json({ error: "Invalid episode value was sent" });
        return;
    }

    if ("watchlist" != params.target) {
        res.status(400); // server error
        res.json({ error: "Invalid update target" });
        return;
    }

    if (
        1 > params.episode ||
        params.episode > MAX_EPISODE_VALUE ||
        undefined == params.name ||
        params.name != utils.sanitizeTextExtended(params.name)
    ) {
        res.status(400); // server error
        res.json({ error: "Invalid episode update requested" });
        return;
    }

    let query = { owner: sess.user_id, _id: db_ops.ObjectId(params.id) };
    let updatedItem = { $set: { name: params.name, status: params.status, episode: parseInt(params.episode), last_update: utils.getFullDate() } };
    await db_ops.updateItem("watchlist", query, updatedItem);

    res.status(200); // OK
    res.end();
});

app.delete("/show", async function(req, res) {
    if (null == sess) {
        res.status(401); // Unauthorized
        res.end();
        return;
    }

    const params = req.body;

    let show_id = params.id;
    if (undefined == show_id) {
        res.status(400); // Bad Request
        res.end();
        return;
    }

    let delete_query = {
        owner: sess.user_id,
        _id: db_ops.ObjectId(show_id)
    };

    await db_ops.deleteItem("watchlist", delete_query);

    res.status(200);
    res.end();
});

app.post("/show", async function(req, res) {
    if (null == sess) {
        res.status(401); // Unauthorized
        res.end();
        return;
    }

    const params = req.body;

    let name = params.name;
    let status = params.status;
    let episode = params.episode;

    if (
        isNaN(episode) ||
        0 >= episode ||
        episode > MAX_EPISODE_VALUE ||
        undefined == name ||
        undefined == status ||
        params.name != utils.sanitizeTextExtended(name) ||
        params.status != utils.sanitizeTextWithSpaces(status)
    ) {
        res.status(400); // Bad Request

        if (episode > MAX_EPISODE_VALUE) {
            res.json({ error: "Episode number is too high" });
            return;
        }

        res.json({ error: "Invalid data sent" });
        return;
    }

    let query = {
        name: name,
        owner: sess.user_id
    };

    let showExists = await db_ops.checkItemExistence("watchlist", query);
    if (showExists.length) {
        res.status(500); // Server Error
        res.json({ error: "This show already exists in " + JSON.stringify(showExists[0].status) });
        return;
    }

    let collections = "watchlist";
    let newShow = {
        name: name,
        status: status,
        owner: sess.user_id,
        episode: parseInt(episode),
        last_update: utils.getFullDate() + ""
    };

    await db_ops.insertItem(collections, newShow);

    res.status(200);
    res.end();
});

app.get("/display", function(req, res) {
    const params = url.parse(req.url, true).query;

    if ("registration_success" === params.do) {
        res.render("registration_successful.html");
        res.end();
        return;
    }

    res.redirect("/");
});

app.get("/register", function(req, res) {
    if (null != sess) {
        res.redirect("/");
        res.end();
        return;
    }

    res.render("registration.html");
    res.end();
    return;
});

app.get("/login", async function(req, res) {
    if (null != sess) {
        res.redirect("/");
        res.end();
        return;
    }

    res.render("login.html");
    res.end();
    return;
});

app.post("/login", async function(req, res) {
    if (null != sess) {
        res.redirect("/");
        return;
    }

    const params = req.body;
    const email = params.email;
    const password = params.password;

    let query = { email: email, password: password };
    let user = await db_ops.queryItem("users", query);

    const expectedNumberOfUser = 1;
    if (expectedNumberOfUser == user.length) {
        console.log("User Logged In.");
        sess = req.session;
        sess.username = user[0].username;
        sess.email = user[0].email;
        sess.user_id = user[0]._id;

        console.log(sess);
        res.status(200);
        res.end();
        return;
    }

    req.session.destroy(function(err) {
        if (err) {
            console.log(err);
        } else {
            res.status(500);
            res.end();
            return;
        }
    });
});

app.post("/logout", function(req, res) {
    if (null == sess) {
        res.redirect("/");
        return;
    }

    req.session.destroy(function(err) {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/");
        }
    });
    sess = null;
    console.log("User Logged Out.");
});

app.post("/register", async function(req, res) {
    if (null != sess) {
        res.redirect("/");
    }

    const params = req.body;

    let username = params.username;
    let password = params.password;
    let email = params.email;

    // Invalid scenario | nothing to process here
    if (!username.length || !password.length || !email.length) {
        res.status(400); // Server Error
        res.json({ error: "A submitted credential is invalid!" });
        return;
    }

    // further sanitize input in case front end was brute-forced to submit unfiltered data
    // username and pw only need letters, numbers, period, and underscore.
    // email has an extra @ symbol allowed
    username = utils.sanitizeText(username);
    password = utils.sanitizeText(password);
    email = utils.sanitizeEmail(email);

    if (params.username != username || params.password != password || params.email != email) {
        res.status(400); // Server Error
        res.json({ error: "Invalid characters detected!" });
        return;
    }

    // check if user exists
    let query = { email: email };
    let userExists = await db_ops.queryItem("users", query);
    if (userExists.length) {
        res.status(400); // Server Error
        res.json({ error: "This email is already in use." });
        return;
    }

    let newUser = {
        username: username,
        password: password,
        email: email
    };

    // user does not exist
    db_ops.insertItem("users", newUser);
    res.status(200); // OK
    res.end();
});
