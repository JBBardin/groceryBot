import os
from typing import Optional
import re

from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

from grocery_bot.liste import Item, GroceryList, ItemKind
import grocery_bot.config as cfg

app = FastAPI()
app.mount("/assets", StaticFiles(directory="assets"), name="static")

lists = {}

# -------------- EVENTS --------------
@app.on_event("startup")
def startup_event():
    for f in filter(lambda f: f.endswith(".yaml"), os.listdir(cfg.SAVE_PATH)):
        lists[re.sub(r"\.yaml$", "", f)] = GroceryList.load(
            os.path.join(cfg.SAVE_PATH, f)
        )


@app.on_event("shutdown")
def shutdown_event():
    for l in lists:
        l.save(cfg.SAVE_PATH)


# -------------- INDEX --------------
@app.get("/", response_class=HTMLResponse)
def read_root():
    with open("assets\index.html", "r") as f:
        return HTMLResponse(content=f.read(), status_code=200)


# -------------- LISTS --------------
@app.get("/list/names")
def read_lists_names():
    return [k for k in lists]


def get_list(list_name: str):
    return lists[list_name]


@app.get("/list/{list_name}")
def read_list(list_name: str):
    return get_list(list_name).get_list()


@app.post("/list")
def create_list(list_: GroceryList):
    if list_.name in lists:
        raise ValueError(
            f"Liste {list_.name} already exist, if you want to overrid it you should delete it first"
        )
    lists[list_.name] = list_
    return read_lists_names()


@app.delete("/list/{list_name}")
def delete_list(list_name: str):
    lists[list_name].clear()
    lists.pop(list_name)
    return read_lists_names()


# -------------- ITEMS --------------
@app.get("/list/{list_name}/items/{item_name}")
def read_item(list_name: str, item_name: str):
    for item in get_list(list_name).get_list():
        if item.name == item_name:
            return item


@app.post("/list/{list_name}/items")
def create_item(list_name: str, item: Item):
    l = get_list(list_name)
    l.add(item)
    l.save(cfg.SAVE_PATH)
    return get_list(list_name).get_list()


@app.put("/list/{list_name}/items")
def update_item(list_name: str, item: Item):
    l = get_list(list_name)
    l.update(item)
    l.save(cfg.SAVE_PATH)
    return get_list(list_name).get_list()


@app.delete("/list/{list_name}/items/{item_name}")
def delete_item(list_name: str, item_name: str):
    l = get_list(list_name)
    l.delete(Item(name=item_name))
    l.save(cfg.SAVE_PATH)
    return get_list(list_name).get_list()


@app.get("/ingredient/listing")
def read_item():
    return ItemKind.get_listing()
