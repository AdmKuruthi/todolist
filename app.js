// jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const {redirect} = require("express/lib/response");
const e = require("express");
const config = require("./config.json");

var _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


mongoose.connect(`mongodb+srv://${config.username}:${config.password}@cluster0.elmz8.mongodb.net/todolistDB`);

const itemSchema = mongoose.Schema({name: String});

const Item = mongoose.model("item", itemSchema);

const defaultItems = [
    new Item(
        {name: "Crea tareas"}
    ),
    new Item(
        {name: "<- Elimina tareas al usar este boton"}
    ),
    new Item(
        {name: "Crea nuevas listas al nombrarlas despues del slash en la direccion"}
    )
];

const listSchema = mongoose.Schema({name: String, items: [itemSchema]});

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {

    Item.find({}, (err, items) => {
        if (err) 
            res.render("list", {
                listTitle: "Today",
                newListItems: [new Item(
                        {name: "Error from database"}
                    )]
            });
         else {
            if (items.length > 0) 
                res.render("list", {
                    listTitle: "Today",
                    newListItems: items
                });
             else {

                Item.insertMany(defaultItems, (err) => {
                    err ? console.log(err) : console.log("Standard items added");
                    res.redirect("/");
                });
            }
        }


    });


});

app.post("/", function (req, res) {

    const item = req.body.newItem;
    const listName = req.body.list;
    const newItem = new Item({name: item});

    if (listName === "Today") {
        newItem.save();
        res.redirect("/");
    } else {
        List.findOne({
            name: listName
        }, (err, responselist) => {
            err ? console.log(err) : console.log("List found");
            if (responselist == null) {
                const items = defaultItems.push(newItem);
                list = new List({name: listName, items: items});
                list.save();

                res.redirect(`/${listName}`);
            } else {
                list = responselist;
                responselist.items.push(newItem);
                responselist.save();

                res.redirect(`/${listName}`);
            }
        });
    }

});

app.post("/delete", function (req, res) {

    console.log(req.body.itemId);
    const listName = req.body.list;
    if (listName === "Today") {
        Item.findByIdAndDelete(req.body.itemId, (err) => {
            err ? console.log("Error deleting item") : res.redirect('/');
        });
    }
    else{
        List.findOne({name : listName}, (err, listFound) => {
            err ? console.log("Error finding item") : console.log("No errors");
            listFound.items.id(req.body.itemId).remove();
            listFound.save((err) => {err ? console.log("Error saving list") : console.log("Saving complete");});
            res.redirect(`/${listName}`);
        })
    }

});

app.get("/:favicon.ico", (req, res) => {
    console.log("Fuck off favicon");
});

app.get("/:listName", function (req, res) {
    const listName = _.capitalize(req.params.listName);
    let list;
    if (listName != "Today") {
        List.findOne({
            name: listName
        }, (err, responselist) => {
            err ? console.log(err) : console.log("List found");
            if (responselist == null) {

                list = new List({name: listName, items: defaultItems});
                list.save();
                res.redirect(`/${listName}`);

            } else {
                list = responselist;
                res.render("list", {
                    listTitle: req.params.listName,
                    newListItems: list.items
                });
            }
        });
    }

});

app.get("/about", function (req, res) {
    res.render("about");
});

app.listen(3000, function () {
    console.log("Server started on port 3000");
});

